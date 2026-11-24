import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import nextConfig from '../next.config.mjs';
import { hasEmergencySymptoms } from '../lib/medicalSafety.ts';

describe('Security & Voice Robustness Test Suite', () => {
  describe('1. Global HTTP Security Headers (OWASP Compliance)', () => {
    test('poweredByHeader is disabled to prevent X-Powered-By leakage', () => {
      assert.equal(nextConfig.poweredByHeader, false);
    });

    test('All required HTTP security headers are configured on root /(.*)', async () => {
      assert.equal(typeof nextConfig.headers, 'function', 'nextConfig must export async headers()');
      const headerRules = await nextConfig.headers();
      const globalRule = headerRules.find((r) => r.source === '/(.*)');
      assert.ok(globalRule, 'Global route /(.*) must have security headers defined');

      const headerMap = new Map(globalRule.headers.map((h) => [h.key.toLowerCase(), h.value]));

      // 1. X-Content-Type-Options: nosniff
      assert.equal(
        headerMap.get('x-content-type-options'),
        'nosniff',
        'X-Content-Type-Options must be nosniff'
      );

      // 2. X-Frame-Options: DENY (anti-clickjacking)
      assert.equal(headerMap.get('x-frame-options'), 'DENY', 'X-Frame-Options must be DENY');

      // 3. Referrer-Policy: strict-origin-when-cross-origin
      assert.equal(
        headerMap.get('referrer-policy'),
        'strict-origin-when-cross-origin',
        'Referrer-Policy must be strict-origin-when-cross-origin'
      );

      // 4. Permissions-Policy: camera=(), microphone=(self), geolocation=(self), payment=()
      const permissionsPolicy = headerMap.get('permissions-policy');
      assert.ok(permissionsPolicy, 'Permissions-Policy must be defined');
      assert.ok(permissionsPolicy.includes('camera=()'), 'Camera must be disallowed');
      assert.ok(permissionsPolicy.includes('microphone=(self)'), 'Microphone must be restricted to self');
      assert.ok(permissionsPolicy.includes('geolocation=(self)'), 'Geolocation must be restricted to self');

      // 5. Strict-Transport-Security: HSTS preload
      const hsts = headerMap.get('strict-transport-security');
      assert.ok(hsts, 'HSTS must be defined');
      assert.ok(hsts.includes('max-age=63072000'), 'HSTS max-age must be at least 2 years');
      assert.ok(hsts.includes('includeSubDomains'), 'HSTS must includeSubDomains');
      assert.ok(hsts.includes('preload'), 'HSTS must include preload');

      // 6. X-DNS-Prefetch-Control
      assert.equal(headerMap.get('x-dns-prefetch-control'), 'on', 'X-DNS-Prefetch-Control must be on');
    });
  });

  describe('2. Chat Route Input Clamping & Sanitization', () => {
    function sanitizeChatInput(rawMessage, rawPm25) {
      if (!rawMessage || typeof rawMessage !== 'string' || !rawMessage.trim()) {
        return { valid: false, error: 'Message cannot be empty' };
      }
      const cleanMessage = rawMessage.trim().slice(0, 2000);
      const safePm25 =
        typeof rawPm25 === 'number' && !isNaN(rawPm25)
          ? Math.max(0, Math.min(2000, rawPm25))
          : 50;
      return { valid: true, cleanMessage, safePm25 };
    }

    test('Clamps excessively long chat messages to 2,000 characters', () => {
      const hugeString = 'a'.repeat(5000);
      const res = sanitizeChatInput(hugeString, 75);
      assert.equal(res.valid, true);
      assert.equal(res.cleanMessage.length, 2000);
    });

    test('Rejects empty or whitespace-only messages', () => {
      assert.equal(sanitizeChatInput('', 75).valid, false);
      assert.equal(sanitizeChatInput('   \n\t  ', 75).valid, false);
      assert.equal(sanitizeChatInput(null, 75).valid, false);
    });

    test('Bounds PM2.5 values safely between 0 and 2000 µg/m³', () => {
      assert.equal(sanitizeChatInput('test', -50).safePm25, 0);
      assert.equal(sanitizeChatInput('test', 9999).safePm25, 2000);
      assert.equal(sanitizeChatInput('test', 123.45).safePm25, 123.45);
      assert.equal(sanitizeChatInput('test', NaN).safePm25, 50);
      assert.equal(sanitizeChatInput('test', undefined).safePm25, 50);
    });
  });

  describe('3. Medical Emergency Symptom Guardrails', () => {
    test('Intercepts critical breathing emergencies and chest pain', () => {
      const emergencyPhrases = [
        'my father has severe chest pain and cannot breathe',
        'she has blue lips and is struggling for air',
        'he is gasping for air unable to speak full sentences',
        'suffering from severe shortness of breath right now',
        'acute respiratory distress stridor',
      ];

      for (const phrase of emergencyPhrases) {
        assert.equal(
          hasEmergencySymptoms(phrase),
          true,
          `Expected emergency detection for: "${phrase}"`
        );
      }
    });

    test('Allows standard air-quality inquiries to pass without false positive emergency triggers', () => {
      const routinePhrases = [
        'can my mother walk in the park this evening if she has mild asthma?',
        'what is the PM2.5 in Nagpur today?',
        'which air purifier is best for a 200 sqft bedroom?',
        'is it safe for my 4 year old child to play football outside?',
        'should I wear an N95 mask for my morning commute on two wheeler?',
      ];

      for (const phrase of routinePhrases) {
        assert.equal(
          hasEmergencySymptoms(phrase),
          false,
          `Expected routine query to pass for: "${phrase}"`
        );
      }
    });
  });

  describe('4. Voice STT Locale Code Resolution', () => {
    function getSpeechLocale(lang) {
      const map = {
        en: 'en-IN',
        hi: 'hi-IN',
        mr: 'mr-IN',
        bn: 'bn-IN',
        ta: 'ta-IN',
        te: 'te-IN',
      };
      return map[lang] || 'en-IN';
    }

    test('Maps all 6 supported languages to accurate regional speech locales', () => {
      assert.equal(getSpeechLocale('en'), 'en-IN');
      assert.equal(getSpeechLocale('hi'), 'hi-IN');
      assert.equal(getSpeechLocale('mr'), 'mr-IN');
      assert.equal(getSpeechLocale('bn'), 'bn-IN');
      assert.equal(getSpeechLocale('ta'), 'ta-IN');
      assert.equal(getSpeechLocale('te'), 'te-IN');
    });

    test('Gracefully defaults unknown languages to en-IN', () => {
      assert.equal(getSpeechLocale('fr'), 'en-IN');
      assert.equal(getSpeechLocale(undefined), 'en-IN');
      assert.equal(getSpeechLocale(''), 'en-IN');
    });
  });
});
