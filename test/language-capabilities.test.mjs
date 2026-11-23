import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const DEFAULT_LANGUAGE_CAPABILITIES = {
  en: { code: 'en', name: 'English', sttEnabled: true, ttsEnabled: true, aiProvider: 'groq' },
  hi: { code: 'hi', name: 'Hindi', sttEnabled: true, ttsEnabled: true, aiProvider: 'groq' },
  mr: { code: 'mr', name: 'Marathi', sttEnabled: true, ttsEnabled: true, aiProvider: 'gemini' },
  bn: { code: 'bn', name: 'Bengali', sttEnabled: true, ttsEnabled: true, aiProvider: 'gemini' },
  ta: { code: 'ta', name: 'Tamil', sttEnabled: true, ttsEnabled: true, aiProvider: 'gemini' },
  te: { code: 'te', name: 'Telugu', sttEnabled: true, ttsEnabled: true, aiProvider: 'gemini' },
  kn: { code: 'kn', name: 'Kannada', sttEnabled: false, ttsEnabled: false, aiProvider: 'gemini' },
  ml: { code: 'ml', name: 'Malayalam', sttEnabled: false, ttsEnabled: false, aiProvider: 'gemini' },
  gu: { code: 'gu', name: 'Gujarati', sttEnabled: false, ttsEnabled: false, aiProvider: 'gemini' },
  pa: { code: 'pa', name: 'Punjabi', sttEnabled: false, ttsEnabled: false, aiProvider: 'gemini' },
  or: { code: 'or', name: 'Odia', sttEnabled: false, ttsEnabled: false, aiProvider: 'gemini' },
};

function isSttSupported(lang) {
  const cap = DEFAULT_LANGUAGE_CAPABILITIES[lang?.toLowerCase()];
  return Boolean(cap?.sttEnabled);
}

function isTtsSupported(lang) {
  const cap = DEFAULT_LANGUAGE_CAPABILITIES[lang?.toLowerCase()];
  return Boolean(cap?.ttsEnabled);
}

describe('Language Capability Table & Voice Enablement Matrix', () => {
  test('Voice (STT and TTS) is enabled for Hindi, Marathi, Bengali, Tamil, Telugu, and English', () => {
    const enabledLangs = ['hi', 'mr', 'bn', 'ta', 'te', 'en'];
    for (const lang of enabledLangs) {
      assert.equal(isSttSupported(lang), true, `STT should be enabled for ${lang}`);
      assert.equal(isTtsSupported(lang), true, `TTS should be enabled for ${lang}`);
    }
  });

  test('Other regional languages are text-only until tested (STT and TTS disabled)', () => {
    const textOnlyLangs = ['kn', 'ml', 'gu', 'pa', 'or'];
    for (const lang of textOnlyLangs) {
      assert.equal(isSttSupported(lang), false, `STT should be disabled for ${lang}`);
      assert.equal(isTtsSupported(lang), false, `TTS should be disabled for ${lang}`);
    }
  });

  test('Gracefully handles unknown or undefined language codes', () => {
    assert.equal(isSttSupported('xyz'), false);
    assert.equal(isTtsSupported('xyz'), false);
    assert.equal(isSttSupported(undefined), false);
    assert.equal(isTtsSupported(null), false);
  });
});
