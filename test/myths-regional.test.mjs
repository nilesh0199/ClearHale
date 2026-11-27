import { test, describe } from 'node:test';
import assert from 'node:assert';
import { MYTH_ITEMS, getMythField } from '../data/myths.ts';

describe('Myths Regional Language Verification', () => {
  const REGIONAL_LANGUAGES = ['hi', 'mr', 'bn', 'ta', 'te'];
  const ALL_LANGUAGES = ['en', ...REGIONAL_LANGUAGES];

  test('All 7 core winter smog myths are present in MYTH_ITEMS', () => {
    assert.strictEqual(MYTH_ITEMS.length, 7, 'Must have exactly 7 myths');
    const ids = MYTH_ITEMS.map((m) => m.id);
    assert.deepStrictEqual(ids, [
      'cloth_masks',
      'houseplants',
      'morning_airing',
      'sealing_airtight',
      'outdoor_breathing',
      'incense_agarbatti',
      'cooking_smoke',
    ]);
  });

  test('Every myth has complete explanations in English, Hindi, and Marathi', () => {
    for (const myth of MYTH_ITEMS) {
      // Titles
      assert.ok(myth.titleEn.length > 5, `${myth.id} missing titleEn`);
      assert.ok(myth.titleHi.length > 5, `${myth.id} missing titleHi`);
      assert.ok(myth.titleMr.length > 5, `${myth.id} missing titleMr`);

      // Claims
      assert.ok(myth.mythTextEn.length > 10, `${myth.id} missing mythTextEn`);
      assert.ok(myth.mythTextHi.length > 10, `${myth.id} missing mythTextHi`);
      assert.ok(myth.mythTextMr.length > 10, `${myth.id} missing mythTextMr`);

      // Explanations (The Scientific Reality)
      assert.ok(myth.explanationEn.length > 20, `${myth.id} missing explanationEn`);
      assert.ok(myth.explanationHi.length > 20, `${myth.id} missing explanationHi`);
      assert.ok(myth.explanationMr.length > 20, `${myth.id} missing explanationMr`);

      // Actionable advice (What to do instead)
      assert.ok(myth.whatToDoEn.length > 15, `${myth.id} missing whatToDoEn`);
      assert.ok(myth.whatToDoHi.length > 15, `${myth.id} missing whatToDoHi`);
      assert.ok(myth.whatToDoMr.length > 15, `${myth.id} missing whatToDoMr`);
    }
  });

  test('Every myth has translations for Bengali, Tamil, and Telugu', () => {
    for (const myth of MYTH_ITEMS) {
      for (const lang of ['bn', 'ta', 'te']) {
        const title = getMythField(myth, 'title', lang);
        const claim = getMythField(myth, 'mythText', lang);
        const exp = getMythField(myth, 'explanation', lang);
        const action = getMythField(myth, 'whatToDo', lang);

        assert.ok(title && title.length > 0, `${myth.id} must have title for ${lang}`);
        assert.ok(claim && claim.length > 0, `${myth.id} must have claim for ${lang}`);
        assert.ok(exp && exp.length > 0, `${myth.id} must have explanation for ${lang}`);
        assert.ok(action && action.length > 0, `${myth.id} must have whatToDo for ${lang}`);
      }
    }
  });

  test('getMythField returns localized text and falls back gracefully', () => {
    const myth = MYTH_ITEMS[0]; // cloth_masks

    // English
    assert.strictEqual(getMythField(myth, 'title', 'en'), myth.titleEn);
    assert.strictEqual(getMythField(myth, 'mythText', 'en'), myth.mythTextEn);
    assert.strictEqual(getMythField(myth, 'explanation', 'en'), myth.explanationEn);

    // Hindi
    assert.strictEqual(getMythField(myth, 'title', 'hi'), myth.titleHi);
    assert.strictEqual(getMythField(myth, 'mythText', 'hi'), myth.mythTextHi);

    // Marathi
    assert.strictEqual(getMythField(myth, 'title', 'mr'), myth.titleMr);
    assert.strictEqual(getMythField(myth, 'mythText', 'mr'), myth.mythTextMr);

    // Unknown language code gracefully falls back to Hindi / English
    const fallbackTitle = getMythField(myth, 'title', 'xx');
    assert.ok(fallbackTitle === myth.titleHi || fallbackTitle === myth.titleEn);
  });

  test('Zero banned jargon in data/myths.ts', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const mythsFile = path.resolve(process.cwd(), 'data/myths.ts');
    const content = fs.readFileSync(mythsFile, 'utf8');

    const BANNED_PATTERNS = [
      /\binversion layer\b/i,
      /\bsolar heating disperses\b/i,
      /\bparticulates\b/i,
      /\bsensitive lower lung\b/i,
      /\bcardiovascular exercise\b/i,
      /\bboundary layer\b/i,
      /\bexposure reduction\b/i,
    ];

    for (const pattern of BANNED_PATTERNS) {
      const match = content.match(pattern);
      assert.strictEqual(match, null, `Found banned jargon "${match?.[0]}" in data/myths.ts`);
    }
  });
});
