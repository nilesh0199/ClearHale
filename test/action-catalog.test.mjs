import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read actions.json directly
const actionsPath = path.join(__dirname, '..', 'data', 'actions.json');
const actions = JSON.parse(fs.readFileSync(actionsPath, 'utf8'));

// Import whyForYou
const { whyForYou } = await import('../lib/whyForYou.ts');

const VALID_ROOMS = ['bedroom', 'kitchen', 'living', 'whole-home', 'outdoors', 'community'];
const VALID_GROUPS = ['Routines', 'Indoors', 'Sustainable swaps'];
const VALID_COST_TIERS = ['Free', 'Low-cost', 'If you can afford'];
const VALID_EVIDENCE = ['Strong', 'Moderate', 'Depends on your home', 'Limited', 'Myth'];

describe('Action Catalog Schema & Data Integrity', () => {
  it('contains at least 30 action items', () => {
    assert.ok(actions.length >= 30, `Catalog has only ${actions.length} items`);
  });

  it('every action contains all required schema fields', () => {
    for (const a of actions) {
      assert.ok(a.id, `Action missing id`);
      assert.ok(a.room, `Action ${a.id} missing room`);
      assert.ok(VALID_ROOMS.includes(a.room), `Action ${a.id} has invalid room: ${a.room}`);
      assert.ok(a.title, `Action ${a.id} missing title`);
      assert.ok(a.doThis, `Action ${a.id} missing doThis`);
      assert.ok(a.whyItWorks, `Action ${a.id} missing whyItWorks`);
      assert.ok(a.cost_tier, `Action ${a.id} missing cost_tier`);
      assert.ok(VALID_COST_TIERS.includes(a.cost_tier), `Action ${a.id} has invalid cost_tier: ${a.cost_tier}`);
      assert.ok(a.timeNeeded, `Action ${a.id} missing timeNeeded`);
      assert.ok(a.evidence, `Action ${a.id} missing evidence`);
      assert.ok(VALID_EVIDENCE.includes(a.evidence), `Action ${a.id} has invalid evidence: ${a.evidence}`);
      assert.ok(a.careful, `Action ${a.id} missing careful`);
      assert.ok(Array.isArray(a.suits), `Action ${a.id} suits must be array`);
      assert.ok(Array.isArray(a.appliesToBands), `Action ${a.id} appliesToBands must be array`);
      assert.strictEqual(typeof a.askOnly, 'boolean', `Action ${a.id} askOnly must be boolean`);
      assert.ok(a.source && a.source.startsWith('http'), `Action ${a.id} must have valid official HTTP source URL`);
      assert.ok(VALID_GROUPS.includes(a.group), `Action ${a.id} has invalid group: ${a.group}`);
    }
  });

  it('every action title is 6 words or fewer', () => {
    for (const a of actions) {
      const wordCount = a.title.trim().split(/\s+/).length;
      assert.ok(
        wordCount <= 6,
        `Action ${a.id} title "${a.title}" has ${wordCount} words (must be 6 or fewer)`
      );
    }
  });

  it('strictly adheres to allowed numbers (no unauthorized percentages anywhere)', () => {
    const ALLOWED_PERCENTAGES = ['50-80%', '40-70%', '55-60%'];

    for (const a of actions) {
      const combinedText = `${a.title} ${a.doThis} ${a.whyItWorks} ${a.careful}`;
      const percentageMatches = combinedText.match(/\b\d+(?:-\d+)?%/g) || [];

      for (const match of percentageMatches) {
        const cleaned = match.replace(/\s+/g, '');
        assert.ok(
          ALLOWED_PERCENTAGES.includes(cleaned),
          `Unauthorized percentage "${match}" found in action ${a.id}: "${combinedText}"`
        );
      }
    }
  });

  it('includes all debunked myths with evidence "Myth"', () => {
    const expectedMyths = [
      'myth_houseplants',
      'myth_cloth_masks',
      'myth_salt_lamps',
      'myth_water_onion',
      'myth_wet_cloths_windows',
      'myth_detox_drinks',
    ];

    for (const mythId of expectedMyths) {
      const mythAction = actions.find((a) => a.id === mythId);
      assert.ok(mythAction, `Missing myth action: ${mythId}`);
      assert.strictEqual(mythAction.evidence, 'Myth', `Action ${mythId} evidence must be "Myth"`);
    }
  });
});

describe('Action Catalog Filtering Rules', () => {
  it('askOnly actions never appear in general action plan query', () => {
    const planItems = actions.filter((a) => !a.askOnly);
    for (const item of planItems) {
      assert.strictEqual(item.askOnly, false, `Action ${item.id} is askOnly and must not be in Plan`);
    }

    const commuteAction = actions.find((a) => a.id === 'commute_clean_choices');
    assert.ok(commuteAction, 'commute_clean_choices should exist in catalog');
    assert.strictEqual(commuteAction.askOnly, true, 'commute_clean_choices must be askOnly: true');
    assert.ok(!planItems.some((a) => a.id === 'commute_clean_choices'), 'commute_clean_choices must be excluded from Plan');
  });

  it('filters actions when user already has a purifier (hasPurifier: true)', () => {
    // When hasPurifier is true, actions that tell user to buy or make one (tagged 'noPurifier') should be hidden
    const withPurifierActions = actions.filter((a) => !a.askOnly && !a.suits.includes('noPurifier'));

    // Should hide buying/building actions
    assert.ok(!withPurifierActions.some((a) => a.id === 'diy_box_fan'), 'diy_box_fan should be hidden for purifier owners');
    assert.ok(!withPurifierActions.some((a) => a.id === 'hepa_purifier'), 'hepa_purifier buying should be hidden for purifier owners');

    // Should keep maintenance actions
    assert.ok(withPurifierActions.some((a) => a.id === 'maintain_purifier_filters'), 'maintain_purifier_filters should be shown');
    assert.ok(withPurifierActions.some((a) => a.id === 'bedroom_sanctuary'), 'bedroom_sanctuary should be shown');
  });

  it('filters actions when user does not have a purifier (hasPurifier: false)', () => {
    // When hasPurifier is false, maintenance of existing purifier should be hidden
    const withoutPurifierActions = actions.filter(
      (a) => !a.askOnly && (!a.suits.includes('hasPurifier') || a.suits.includes('noPurifier'))
    );

    assert.ok(!withoutPurifierActions.some((a) => a.id === 'maintain_purifier_filters'), 'maintain_purifier_filters should be hidden');
    assert.ok(withoutPurifierActions.some((a) => a.id === 'diy_box_fan'), 'diy_box_fan should be visible');
    assert.ok(withoutPurifierActions.some((a) => a.id === 'hepa_purifier'), 'hepa_purifier should be visible');
  });

  it('correctly partitions actions by budget tiers', () => {
    const isWithinBudget = (costTier, budget) => {
      if (budget === 'free_only') return costTier === 'Free';
      if (budget === 'low_cost') return costTier === 'Free' || costTier === 'Low-cost';
      return true;
    };

    // Free only
    const freeOnlyIn = actions.filter((a) => isWithinBudget(a.cost_tier, 'free_only'));
    const freeOnlyBeyond = actions.filter((a) => !isWithinBudget(a.cost_tier, 'free_only'));
    assert.ok(freeOnlyIn.every((a) => a.cost_tier === 'Free'));
    assert.ok(freeOnlyBeyond.every((a) => a.cost_tier === 'Low-cost' || a.cost_tier === 'If you can afford'));

    // Low cost
    const lowCostIn = actions.filter((a) => isWithinBudget(a.cost_tier, 'low_cost'));
    const lowCostBeyond = actions.filter((a) => !isWithinBudget(a.cost_tier, 'low_cost'));
    assert.ok(lowCostIn.every((a) => a.cost_tier === 'Free' || a.cost_tier === 'Low-cost'));
    assert.ok(lowCostBeyond.every((a) => a.cost_tier === 'If you can afford'));

    // Flexible
    const flexibleIn = actions.filter((a) => isWithinBudget(a.cost_tier, 'flexible'));
    const flexibleBeyond = actions.filter((a) => !isWithinBudget(a.cost_tier, 'flexible'));
    assert.strictEqual(flexibleIn.length, actions.length);
    assert.strictEqual(flexibleBeyond.length, 0);
  });
});

describe('whyForYou Personalized Reasoning Engine', () => {
  const livePoor = { current: { pm2_5: 110, aqi_band: 'poor' } };

  it('explains LPG cooktop reason when user cooks on LPG and air is poor', () => {
    const action = actions.find((a) => a.id === 'kitchen_exhaust_chimney');
    const profile = {
      onboardingCompleted: true,
      household: {
        members: ['adults'],
        cookingFuel: 'lpg',
        commute: ['car'],
        work: 'indoor',
        budget: 'low_cost',
      },
    };

    const reason = whyForYou(action, profile, livePoor);
    assert.ok(reason.includes('LPG') && reason.includes('Poor band'), `Expected LPG & Poor band in: "${reason}"`);
  });

  it('explains senior reason when household member is elderly and air is poor', () => {
    const action = actions.find((a) => a.id === 'n95_respirator');
    const profile = {
      onboardingCompleted: true,
      household: {
        members: ['adults', 'elderly'],
        cookingFuel: 'induction_electric',
        commute: ['car'],
        work: 'indoor',
        budget: 'flexible',
      },
    };

    const reason = whyForYou(action, profile, livePoor);
    assert.ok(reason.includes('over 60'), `Expected "over 60" in: "${reason}"`);
  });

  it('explains two-wheeler commuter reason when user rides a two-wheeler', () => {
    const action = actions.find((a) => a.id === 'n95_respirator');
    const profile = {
      onboardingCompleted: true,
      household: {
        members: ['adults'],
        cookingFuel: 'induction_electric',
        commute: ['two_wheeler'],
        work: 'indoor',
        budget: 'low_cost',
      },
    };

    const reason = whyForYou(action, profile, livePoor);
    assert.ok(reason.includes('two-wheeler'), `Expected "two-wheeler" in: "${reason}"`);
  });

  it('falls back cleanly to generic reasoning when profile setup was skipped', () => {
    const action = actions.find((a) => a.id === 'bedroom_sanctuary');
    const reasonNoProfile = whyForYou(action, null, livePoor);
    assert.ok(reasonNoProfile && reasonNoProfile.length > 10, 'Fallback reason should be non-empty');

    const profileSkipped = { onboardingCompleted: false, household: null };
    const reasonSkipped = whyForYou(action, profileSkipped, livePoor);
    assert.strictEqual(reasonSkipped, action.whyItWorks, 'Skipped onboarding should return whyItWorks');
  });
});
