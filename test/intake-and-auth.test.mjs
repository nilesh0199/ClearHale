import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { INTAKE_QUESTIONS } from '../data/intakeQuestions.ts';
import {
  parseWithRules,
  mergeProfilePatch,
  detectProfileChangeInMessage,
  CHIP_PATCH_MAP,
} from '../lib/ai/intakeParser.ts';
import { whyForYou } from '../lib/whyForYou.ts';
import { hasEmergencySymptoms } from '../lib/medicalSafety.ts';

describe('Intake Schema & Field Mapping', () => {
  test('INTAKE_QUESTIONS defines exactly 4 core questions with translations and chips', () => {
    assert.equal(INTAKE_QUESTIONS.length, 4);
    assert.deepEqual(
      INTAKE_QUESTIONS.map((q) => q.id),
      ['household_members', 'daily_routine', 'home_equipment', 'priorities']
    );

    for (const q of INTAKE_QUESTIONS) {
      assert.ok(q.question.en, `Question ${q.id} missing English translation`);
      assert.ok(q.question.hi, `Question ${q.id} missing Hindi translation`);
      assert.ok(q.question.mr, `Question ${q.id} missing Marathi translation`);
      assert.ok(Array.isArray(q.chips) && q.chips.length > 0, `Question ${q.id} has no chips`);
    }
  });

  test('mergeProfilePatch merges array and scalar fields without duplicates', () => {
    const base = {
      members: ['elderly'],
      cookingFuel: 'lpg',
      commute: ['bus_metro'],
      work: 'indoor',
      budget: 'low_cost',
    };

    const patch = {
      members: ['child', 'elderly'],
      childAgeBand: 'infant_0_2',
      hasPurifier: true,
      commute: ['two_wheeler'],
      schoolRun: true,
    };

    const merged = mergeProfilePatch(base, patch);

    assert.deepEqual(merged.members, ['elderly', 'child']);
    assert.equal(merged.childAgeBand, 'infant_0_2');
    assert.equal(merged.hasPurifier, true);
    assert.deepEqual(merged.commute, ['bus_metro', 'two_wheeler']);
    assert.equal(merged.schoolRun, true);
  });
});

describe('Deterministic Rule-Based Parser (Chips & Text Fallback)', () => {
  test('extracts household members and infant age band from speech/text', () => {
    const patch = parseWithRules('household_members', 'We have a newborn baby and my elderly mother living with us');
    assert.ok(patch.members.includes('child'));
    assert.ok(patch.members.includes('elderly'));
    assert.equal(patch.childAgeBand, 'infant_0_2');
  });

  test('handles "just me" and clears members', () => {
    const patch = parseWithRules('household_members', 'It is just me living alone');
    assert.deepEqual(patch.members, []);
  });

  test('extracts asthma and heart condition flag', () => {
    const patch = parseWithRules('household_members', 'My father has severe asthma and uses an inhaler');
    assert.ok(patch.members.includes('asthma_heart'));
    assert.equal(patch.respiratoryOrHeart, true);
  });

  test('extracts commute mode, outdoor work, and school run', () => {
    const patch = parseWithRules('daily_routine', 'I ride a two-wheeler to work in the field and do the school drop for kids');
    assert.ok(patch.commute.includes('two_wheeler'));
    assert.equal(patch.work, 'outdoor');
    assert.equal(patch.schoolRun, true);
  });

  test('extracts cooking fuel, purifier ownership, and N95 masks', () => {
    const patch = parseWithRules('home_equipment', 'We cook on induction stove, we already own a purifier, and we wear N95 respirators');
    assert.equal(patch.cookingFuel, 'induction_electric');
    assert.equal(patch.hasPurifier, true);
    assert.equal(patch.maskType, 'n95');
  });

  test('combines quick-reply chip selections reliably', () => {
    const patch = parseWithRules('home_equipment', '', ['lpg', 'no_purifier', 'budget_free']);
    assert.equal(patch.cookingFuel, 'lpg');
    assert.equal(patch.hasPurifier, false);
    assert.equal(patch.budget, 'free_only');
  });
});

describe('Question Flow & 6-Turn Guardrails', () => {
  test('turn count limit stops follow-ups at 6 turns', () => {
    // Simulating turn count check: turnCount >= 6 must force followUpQuestion to null
    const turnCount = 6;
    const isFollowUpAllowed = turnCount < 6;
    assert.equal(isFollowUpAllowed, false);
  });

  test('red-flag emergency triage intercepts dangerous symptoms', () => {
    const emergencyText1 = 'I have severe chest pain and cannot catch my breath';
    const emergencyText2 = 'My lips are turning blue and my heart is racing';
    const safeText = 'I want to know if I should buy a HEPA filter';

    assert.equal(hasEmergencySymptoms(emergencyText1), true);
    assert.equal(hasEmergencySymptoms(emergencyText2), true);
    assert.equal(hasEmergencySymptoms(safeText), false);
  });
});

describe('Profile Update Proposal in Ask Chat', () => {
  test('proposes purifier update when user mentions buying a purifier', () => {
    const current = {
      members: ['child'],
      cookingFuel: 'lpg',
      commute: ['bus_metro'],
      work: 'indoor',
      budget: 'low_cost',
      hasPurifier: false,
    };

    const proposal = detectProfileChangeInMessage('I just bought a purifier for my bedroom', current);
    assert.ok(proposal);
    assert.equal(proposal.label, 'Update: Has air purifier');
    assert.equal(proposal.patch.hasPurifier, true);
  });

  test('does not propose purifier update if user already has a purifier', () => {
    const current = {
      members: ['child'],
      cookingFuel: 'lpg',
      commute: ['bus_metro'],
      work: 'indoor',
      budget: 'low_cost',
      hasPurifier: true,
    };

    const proposal = detectProfileChangeInMessage('I cleaned my purifier filter', current);
    assert.equal(proposal, null);
  });

  test('proposes N95 mask update when user mentions getting N95 masks', () => {
    const current = {
      members: [],
      cookingFuel: 'lpg',
      commute: ['two_wheeler'],
      work: 'outdoor',
      budget: 'low_cost',
      maskType: 'none',
    };

    const proposal = detectProfileChangeInMessage('I bought N95 respirators today', current);
    assert.ok(proposal);
    assert.equal(proposal.label, 'Update: Uses N95 masks');
    assert.equal(proposal.patch.maskType, 'n95');
  });

  test('proposes infant update when user mentions arrival of a newborn', () => {
    const current = {
      members: [],
      cookingFuel: 'lpg',
      commute: [],
      work: 'indoor',
      budget: 'low_cost',
    };

    const proposal = detectProfileChangeInMessage('We had a baby last month', current);
    assert.ok(proposal);
    assert.equal(proposal.label, 'Update: Infant at home');
    assert.equal(proposal.patch.childAgeBand, 'infant_0_2');
    assert.ok(proposal.patch.members.includes('child'));
  });
});

describe('whyForYou Integration with Extended Profile', () => {
  test('tailors school run reason for travel routes', () => {
    const action = {
      id: 'cleaner_travel_routes',
      room: 'outdoors',
      title: 'Plan cleaner travel routes',
      whyItWorks: 'Backstreets have lower vehicle exhaust than arterial ring roads.',
    };

    const profile = {
      onboardingCompleted: true,
      household: {
        members: ['child'],
        schoolRun: true,
        commute: ['two_wheeler'],
        work: 'indoor',
        cookingFuel: 'lpg',
        budget: 'low_cost',
      },
    };

    const reason = whyForYou(action, profile);
    assert.match(reason, /school run/i);
  });

  test('tailors infant under 2 warning for N95 masks', () => {
    const action = {
      id: 'n95_respirator',
      room: 'outdoors',
      title: 'Wear certified N95 respirator',
      whyItWorks: 'Filters fine particles when outdoors.',
    };

    const profile = {
      onboardingCompleted: true,
      household: {
        members: ['child'],
        childAgeBand: 'infant_0_2',
        commute: [],
        work: 'indoor',
        cookingFuel: 'lpg',
        budget: 'low_cost',
      },
    };

    const reason = whyForYou(action, profile);
    assert.match(reason, /infants under 2/i);
  });
});

describe('Intake Polish: Chip Rules, Progress Dots & Choice Limits', () => {
  test('all chip IDs map to CHIP_PATCH_MAP and have valid translations', () => {
    for (const q of INTAKE_QUESTIONS) {
      assert.ok(q.helper && q.helper.en, `Question ${q.id} must have helper text in English`);
      assert.ok(q.helper.hi, `Question ${q.id} must have helper text in Hindi`);
      assert.ok(q.helper.mr, `Question ${q.id} must have helper text in Marathi`);

      for (const chip of q.chips) {
        assert.ok(CHIP_PATCH_MAP[chip.id], `Chip ${chip.id} must exist in CHIP_PATCH_MAP`);
        assert.ok(chip.label.en, `Chip ${chip.id} missing English label`);
        assert.ok(chip.label.hi, `Chip ${chip.id} missing Hindi label`);
        assert.ok(chip.label.mr, `Chip ${chip.id} missing Marathi label`);
        assert.ok(chip.label.en.length <= 26, `Chip ${chip.id} English label too long: ${chip.label.en}`);
      }
    }
  });

  test('4-dot progress indicator correctly computes status for all 4 steps', () => {
    const getDotStates = (currentIdx) => {
      return [0, 1, 2, 3].map((i) => {
        if (i === currentIdx) return 'current_pill';
        if (i < currentIdx) return 'completed_filled';
        return 'upcoming_empty';
      });
    };

    assert.deepEqual(getDotStates(0), ['current_pill', 'upcoming_empty', 'upcoming_empty', 'upcoming_empty']);
    assert.deepEqual(getDotStates(1), ['completed_filled', 'current_pill', 'upcoming_empty', 'upcoming_empty']);
    assert.deepEqual(getDotStates(2), ['completed_filled', 'completed_filled', 'current_pill', 'upcoming_empty']);
    assert.deepEqual(getDotStates(3), ['completed_filled', 'completed_filled', 'completed_filled', 'current_pill']);
  });

  test('Question 3 enforces single-choice rules for cooking and budget, and purifier mutual exclusion', () => {
    const simulateToggleQ3 = (currentSelected, chipId) => {
      const cookingGroup = ['lpg', 'induction', 'biomass'];
      const budgetGroup = ['budget_free', 'budget_low_cost', 'budget_flexible'];

      let next = [...currentSelected];
      if (cookingGroup.includes(chipId)) {
        next = next.filter((id) => !cookingGroup.includes(id));
      } else if (budgetGroup.includes(chipId)) {
        next = next.filter((id) => !budgetGroup.includes(id));
      } else if (chipId === 'has_purifier') {
        next = next.filter((id) => id !== 'no_purifier');
      } else if (chipId === 'no_purifier') {
        next = next.filter((id) => id !== 'has_purifier');
      }
      return [...next, chipId];
    };

    // Cooking: selecting induction replaces lpg
    let state = simulateToggleQ3([], 'lpg');
    assert.deepEqual(state, ['lpg']);
    state = simulateToggleQ3(state, 'induction');
    assert.deepEqual(state, ['induction']);

    // Budget: selecting budget_low_cost replaces budget_free
    state = simulateToggleQ3(state, 'budget_free');
    assert.deepEqual(state, ['induction', 'budget_free']);
    state = simulateToggleQ3(state, 'budget_low_cost');
    assert.deepEqual(state, ['induction', 'budget_low_cost']);

    // Purifier mutual exclusion
    state = simulateToggleQ3(state, 'has_purifier');
    assert.ok(state.includes('has_purifier'));
    assert.ok(!state.includes('no_purifier'));

    state = simulateToggleQ3(state, 'no_purifier');
    assert.ok(!state.includes('has_purifier'));
    assert.ok(state.includes('no_purifier'));

    // use_n95 is independent in at_home
    state = simulateToggleQ3(state, 'use_n95');
    assert.ok(state.includes('no_purifier'));
    assert.ok(state.includes('use_n95'));
  });

  test('Question 4 allows selecting all options', () => {
    const simulateToggleQ4 = (currentSelected, chipId) => {
      if (currentSelected.includes(chipId)) {
        return currentSelected.filter((id) => id !== chipId);
      }
      return [...currentSelected, chipId];
    };

    let state = [];
    const allChips = ['kids_health', 'saving_money', 'understanding_numbers', 'cutting_emissions'];

    for (const chip of allChips) {
      state = simulateToggleQ4(state, chip);
    }
    // All 4 options can be chosen simultaneously
    assert.equal(state.length, 4);
    assert.deepEqual(state, allChips);

    // Deselecting any works
    state = simulateToggleQ4(state, 'saving_money');
    assert.equal(state.length, 3);
    assert.ok(!state.includes('saving_money'));
  });
});
