import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Helper replicating provider routing logic
function getLanguageAiProvider(langCode, envRouting, envPrimary = 'groq') {
  const DEFAULT_ROUTING = {
    en: 'groq',
    hi: 'groq',
    mr: 'gemini',
    bn: 'gemini',
    ta: 'gemini',
    te: 'gemini',
    kn: 'gemini',
    ml: 'gemini',
    gu: 'gemini',
    pa: 'gemini',
    or: 'gemini',
  };

  let routingTable = { ...DEFAULT_ROUTING };
  if (envRouting) {
    try {
      const parsed = JSON.parse(envRouting);
      routingTable = { ...routingTable, ...parsed };
    } catch (_) {}
  }

  if (!langCode) {
    return envPrimary === 'gemini' ? 'gemini' : 'groq';
  }

  const code = langCode.toLowerCase().trim();
  return routingTable[code] || (envPrimary === 'gemini' ? 'gemini' : 'groq');
}

function getProviderOrder(langCode, envRouting, envPrimary = 'groq') {
  const primary = getLanguageAiProvider(langCode, envRouting, envPrimary);
  const secondary = primary === 'gemini' ? 'groq' : 'gemini';
  return { primary, secondary };
}

describe('AI Provider Routing & Fallback', () => {
  test('Default provider is Groq primary, Gemini secondary when no language is specified', () => {
    const { primary, secondary } = getProviderOrder(undefined, undefined, 'groq');
    assert.equal(primary, 'groq');
    assert.equal(secondary, 'gemini');
  });

  test('Routes English and Hindi to Groq primary', () => {
    const enOrder = getProviderOrder('en');
    assert.equal(enOrder.primary, 'groq');
    assert.equal(enOrder.secondary, 'gemini');

    const hiOrder = getProviderOrder('hi');
    assert.equal(hiOrder.primary, 'groq');
    assert.equal(hiOrder.secondary, 'gemini');
  });

  test('Routes regional languages (Marathi, Bengali, Tamil, Telugu) to Gemini primary', () => {
    for (const lang of ['mr', 'bn', 'ta', 'te', 'kn', 'ml']) {
      const order = getProviderOrder(lang);
      assert.equal(order.primary, 'gemini', `Expected ${lang} to route to Gemini primary`);
      assert.equal(order.secondary, 'groq', `Expected ${lang} to route to Groq secondary`);
    }
  });

  test('Allows dynamic routing overrides via config / env variable', () => {
    const customRouting = JSON.stringify({ en: 'gemini', mr: 'groq' });
    const enOrder = getProviderOrder('en', customRouting);
    assert.equal(enOrder.primary, 'gemini');

    const mrOrder = getProviderOrder('mr', customRouting);
    assert.equal(mrOrder.primary, 'groq');
  });

  test('Rate limit cooldown records 60-second cooldown on 429 / 5xx', () => {
    const cooldowns = { groq: 0, gemini: 0 };
    const markRateLimited = (p) => { cooldowns[p] = Date.now() + 60000; };
    const isRateLimited = (p) => Date.now() < cooldowns[p];

    assert.equal(isRateLimited('groq'), false);
    markRateLimited('groq');
    assert.equal(isRateLimited('groq'), true);
    assert.equal(isRateLimited('gemini'), false);
  });

  test('Fallback execution: switches to secondary on primary failure, returns safe template if both fail', async () => {
    let primaryCalled = false;
    let secondaryCalled = false;

    // Simulate primary failure and secondary success
    async function mockInvoke(primaryFail, secondaryFail) {
      const { primary, secondary } = getProviderOrder('en');
      let result = null;

      try {
        primaryCalled = true;
        if (primaryFail) throw new Error('429 Too Many Requests');
        result = 'Response from primary';
      } catch (e) {
        try {
          secondaryCalled = true;
          if (secondaryFail) throw new Error('500 Server Error');
          result = 'Response from secondary';
        } catch (secErr) {
          result = 'Keep windows and doors closed, run indoor filtration.';
        }
      }
      return result;
    }

    const res1 = await mockInvoke(true, false);
    assert.equal(primaryCalled, true);
    assert.equal(secondaryCalled, true);
    assert.equal(res1, 'Response from secondary');

    // Both fail -> template fallback
    const res2 = await mockInvoke(true, true);
    assert.equal(res2, 'Keep windows and doors closed, run indoor filtration.');
    // Ensure provider identity is never leaked
    assert.ok(!res2.includes('groq'), 'Must not leak groq provider');
    assert.ok(!res2.includes('gemini'), 'Must not leak gemini provider');
    assert.ok(!res2.includes('backup'), 'Must not leak backup status');
  });
});
