import actionsData from '../data/actions.json' with { type: 'json' };
import type { ActionGroup, ActionItem, AQIBandKey, FamilyView, UserProfile, WhatIfResult } from '../types';
export type { WhatIfResult };
import { outdoorGuidance } from './outdoorGuidance';
export { whyForYou } from './whyForYou';
export { getBandPersonaAdvice } from './bandAdvice';

export const ALL_ACTIONS: ActionItem[] = actionsData as ActionItem[];

/**
 * Dynamically adapts an action's title, why, and effect text based on air quality:
 * - If air quality is Good or Satisfactory: Celebrates clean air, promotes outdoor walks,
 *   open window fresh air, playground play, and garden walks.
 * - If air quality is Poor, Very Poor, or Severe: Recommends indoor protection, sealing windows,
 *   and wearing N95 respirators.
 */
export function getAdaptiveAction(
  action: ActionItem,
  aqiBandKey: AQIBandKey = 'poor',
  lang: string = 'en'
): ActionItem {
  const isCleanAir = aqiBandKey === 'good' || aqiBandKey === 'satisfactory';
  const isModerate = aqiBandKey === 'moderate';

  if (!isCleanAir && !isModerate) {
    return action;
  }

  const item: ActionItem = { ...action };

  if (action.id === 'move_exercise_indoors') {
    if (isCleanAir) {
      item.title = 'Exercise outdoors in parks & open grounds';
      item.why =
        'Outdoor air quality is clean and healthy. Working out, running, cycling, or doing sports in city parks expands lung capacity with fresh oxygen.';
      item.effect_text = 'Healthy exercise and fresh oxygen in clean natural air.';
      item.cost_tier = 'Free';
      item.outdoorPositive = true;
    }
  } else if (action.id === 'windows_doors_closed') {
    if (isCleanAir) {
      item.title = 'Open windows for fresh air';
      item.why =
        'Outdoor air is pure. Opening windows flushes out trapped indoor air and cooking fumes.';
      item.effect_text = 'Flushes stale indoor air and brings in clean outdoor air.';
      item.cost_tier = 'Free';
    } else if (isModerate) {
      item.title = 'Air out home during midday';
      item.why =
        'Air out for 20 minutes between 12–3 PM when the sun warms the air and smoke spreads out.';
      item.effect_text = 'Refreshes indoor air during the cleanest daily window.';
    }
  } else if (action.id === 'child_play_school_timing') {
    if (isCleanAir) {
      item.title = 'Encourage outdoor play & playground games';
      item.why =
        'Outdoor air is clean and safe. Active physical play outdoors builds stamina and fitness.';
      item.effect_text = 'Promotes healthy child development in fresh air.';
      item.cost_tier = 'Free';
      item.outdoorPositive = true;
    } else if (isModerate) {
      item.title = 'Time outdoor sports for cleaner afternoons';
      item.why =
        'Air is acceptable; schedule outdoor play after 11 AM when cold morning air lifts.';
      item.effect_text = 'Allows active play while avoiding early morning smoke peaks.';
      item.outdoorPositive = false;
    }
  } else if (action.id === 'elderly_clean_room') {
    if (isCleanAir) {
      item.title = 'Enjoy pleasant morning or evening garden walks';
      item.why =
        'Clean air and natural outdoor daylight boost heart health, joint mobility, and wellness.';
      item.effect_text = 'Safe walking and fresh oxygen without smoke stress.';
      item.cost_tier = 'Free';
      item.outdoorPositive = true;
    } else if (isModerate) {
      item.title = 'Enjoy gentle walks during sunny afternoon hours';
      item.why =
        'Take leisurely walks between 12–4 PM when ambient smoke is lowest.';
      item.effect_text = 'Gentle walks in comfortable daytime temperatures.';
      item.outdoorPositive = false;
    }
  } else if (
    action.id === 'pregnant_avoid_smog_errands' ||
    action.id === 'pregnant_sanctuary_filtration'
  ) {
    if (isCleanAir) {
      item.title = 'Take peaceful outdoor walks in green parks';
      item.why =
        'Fresh air, gentle walking, and natural greenery reduce maternal stress and improve blood flow.';
      item.effect_text = 'Safe prenatal wellness and relaxation in clean natural air.';
      item.cost_tier = 'Free';
      item.outdoorPositive = true;
    }
  } else if (action.id === 'n95_respirator') {
    if (isCleanAir) {
      item.title = 'Breathe freely outdoors without a mask';
      item.why =
        'Ambient air is well within national safe limits. Enjoy unrestricted, natural breathing during commutes and walks.';
      item.effect_text = 'Zero restriction; healthy natural breathing.';
      item.cost_tier = 'Free';
    } else if (isModerate) {
      item.title = 'Keep N95 mask handy only for heavy traffic zones';
      item.why =
        'General air is acceptable; use mask only if stuck in congested traffic or construction dust.';
      item.effect_text = 'Targeted protection in congested roadside hotspots.';
    }
  } else if (action.id === 'shift_commute_hours') {
    if (isCleanAir) {
      item.title = 'Enjoy active walking or cycling commutes';
      item.why =
        'Low pollution levels make active travel healthy and pleasant throughout the entire day.';
      item.effect_text = 'Active commuting boosts fitness with zero emissions.';
      item.cost_tier = 'Free';
    }
  } else if (action.id === 'hepa_purifier') {
    if (isCleanAir) {
      item.title = 'Run purifier on whisper eco-mode or open windows';
      item.why =
        'Outdoor air is clean. Save electricity by putting purifiers on low/eco mode or relying on fresh air from open windows.';
      item.effect_text = 'Conserves energy while keeping baseline indoor cleanliness.';
      item.cost_tier = 'Free';
    }
  }

  return item;
}

export function actionMatchesAudience(action: ActionItem, familyView: FamilyView): boolean {
  if (familyView === 'whole_family') return true;
  if (!action.suits) return false;
  if (action.suits.includes(familyView) || action.suits.includes('whole_family')) return true;
  if (
    familyView === 'outdoor_worker' &&
    (action.suits.includes('outdoorWorker') || action.suits.includes('outdoor_worker'))
  ) {
    return true;
  }
  return false;
}

export function getFilteredAndRankedActions(
  profile: UserProfile,
  aqiBandKey: AQIBandKey,
  familyView: FamilyView = profile.activeFamilyFilter || 'whole_family'
): ActionItem[] {
  const isCleanAir = aqiBandKey === 'good' || aqiBandKey === 'satisfactory';
  const isSevereOrVeryPoor = aqiBandKey === 'severe' || aqiBandKey === 'very_poor';
  const isPoorOrModerate = aqiBandKey === 'poor' || aqiBandKey === 'moderate';

  // 1. Filter: actions matching familyView or whole_family fallback, adapted to current air
  // Exclude askOnly actions and respect purifier ownership
  const outdoorInfo = outdoorGuidance(aqiBandKey, null, familyView, profile, profile?.language);
  let adaptedActions = ALL_ACTIONS
    .filter((a) => !a.askOnly)
    .filter((a) => outdoorInfo.level === 'go' || !a.outdoorPositive)
    .map((a) => getAdaptiveAction(a, aqiBandKey, profile?.language));

  if (profile?.household?.hasPurifier === true) {
    adaptedActions = adaptedActions.filter((a) => !a.suits?.includes('noPurifier'));
  } else if (profile?.household?.hasPurifier === false) {
    adaptedActions = adaptedActions.filter((a) => !a.suits?.includes('hasPurifier') || a.suits?.includes('noPurifier'));
  }

  let filtered = adaptedActions.filter((action) => actionMatchesAudience(action, familyView));

  // Never show empty state: fallback to whole family if no specific actions match
  if (filtered.length === 0) {
    filtered = [...adaptedActions];
  }

  return [...filtered].sort((a, b) => {
    // Myths always go to the bottom of their sections
    if (a.evidence_level === 'Myth' && b.evidence_level !== 'Myth') return 1;
    if (b.evidence_level === 'Myth' && a.evidence_level !== 'Myth') return -1;

    let scoreA = 0;
    let scoreB = 0;

    // Direct persona suitability bonus
    if (familyView !== 'whole_family') {
      const suitsPersonaA = actionMatchesAudience(a, familyView);
      const suitsPersonaB = actionMatchesAudience(b, familyView);
      if (suitsPersonaA) scoreA += 25;
      if (suitsPersonaB) scoreB += 25;
    }

    // Dynamic clean-air vs smog-air ranking:
    if (isCleanAir) {
      if (familyView === 'whole_family') {
        if (a.id === 'move_exercise_indoors' || a.id === 'good_day_outdoor_workout') scoreA += 35;
        if (b.id === 'move_exercise_indoors' || b.id === 'good_day_outdoor_workout') scoreB += 35;
      } else if (familyView === 'outdoor_worker') {
        // Outdoor workers need commute/shift advice, not generic park workouts
        if (a.id === 'cleaner_travel_routes') scoreA += 38;
        if (b.id === 'cleaner_travel_routes') scoreB += 38;
        if (a.id === 'pick_lightest_hour_errands') scoreA += 34;
        if (b.id === 'pick_lightest_hour_errands') scoreB += 34;
        if (a.id === 'commute_clean_choices') scoreA += 30;
        if (b.id === 'commute_clean_choices') scoreB += 30;
      } else if (familyView === 'child') {
        if (a.id === 'good_day_outdoor_workout' || a.id === 'move_exercise_indoors') scoreA += 38;
        if (b.id === 'good_day_outdoor_workout' || b.id === 'move_exercise_indoors') scoreB += 38;
        if (a.id === 'air_out_cleanest_hour') scoreA += 30;
        if (b.id === 'air_out_cleanest_hour') scoreB += 30;
      } else if (familyView === 'elderly') {
        if (a.id === 'good_day_outdoor_workout' || a.id === 'move_exercise_indoors') scoreA += 38;
        if (b.id === 'good_day_outdoor_workout' || b.id === 'move_exercise_indoors') scoreB += 38;
        if (a.id === 'air_out_cleanest_hour') scoreA += 30;
        if (b.id === 'air_out_cleanest_hour') scoreB += 30;
      } else if (familyView === 'pregnant') {
        if (a.id === 'good_day_outdoor_workout' || a.id === 'move_exercise_indoors') scoreA += 38;
        if (b.id === 'good_day_outdoor_workout' || b.id === 'move_exercise_indoors') scoreB += 38;
        if (a.id === 'air_out_cleanest_hour') scoreA += 30;
        if (b.id === 'air_out_cleanest_hour') scoreB += 30;
      }

      if (a.id === 'windows_doors_closed' || a.id === 'air_out_cleanest_hour') scoreA += 28;
      if (b.id === 'windows_doors_closed' || b.id === 'air_out_cleanest_hour') scoreB += 28;

      // Demote smog-specific actions in clean air
      if (a.id === 'n95_respirator' || a.id === 'diy_box_fan') scoreA -= 20;
      if (b.id === 'n95_respirator' || b.id === 'diy_box_fan') scoreB -= 20;
    } else {
      // IN SMOG AIR:
      if (familyView === 'outdoor_worker') {
        if (a.id === 'n95_respirator') scoreA += 42;
        if (b.id === 'n95_respirator') scoreB += 42;
        if (a.id === 'shift_outdoor_offpeak') scoreA += 36;
        if (b.id === 'shift_outdoor_offpeak') scoreB += 36;
        if (a.id === 'cleaner_travel_routes') scoreA += 30;
        if (b.id === 'cleaner_travel_routes') scoreB += 30;
      } else if (familyView === 'child') {
        if (a.id === 'bedroom_sanctuary') scoreA += 42;
        if (b.id === 'bedroom_sanctuary') scoreB += 42;
        if (a.id === 'move_exercise_indoors') scoreA += 36;
        if (b.id === 'move_exercise_indoors') scoreB += 36;
        if (a.id === 'bedroom_door_towel') scoreA += 30;
        if (b.id === 'bedroom_door_towel') scoreB += 30;
        if (a.id === 'hepa_purifier') scoreA += 24;
        if (b.id === 'hepa_purifier') scoreB += 24;
      } else if (familyView === 'elderly') {
        if (a.id === 'bedroom_sanctuary') scoreA += 42;
        if (b.id === 'bedroom_sanctuary') scoreB += 42;
        if (a.id === 'shift_outdoor_offpeak') scoreA += 36;
        if (b.id === 'shift_outdoor_offpeak') scoreB += 36;
        if (a.id === 'move_exercise_indoors') scoreA += 32;
        if (b.id === 'move_exercise_indoors') scoreB += 32;
        if (a.id === 'bedroom_door_towel') scoreA += 28;
        if (b.id === 'bedroom_door_towel') scoreB += 28;
      } else if (familyView === 'pregnant') {
        if (a.id === 'bedroom_sanctuary') scoreA += 42;
        if (b.id === 'bedroom_sanctuary') scoreB += 42;
        if (a.id === 'shift_outdoor_offpeak') scoreA += 36;
        if (b.id === 'shift_outdoor_offpeak') scoreB += 36;
        if (a.id === 'n95_respirator') scoreA += 32;
        if (b.id === 'n95_respirator') scoreB += 32;
      } else {
        if (isSevereOrVeryPoor) {
          if (a.id === 'shut_windows_smog' || a.id === 'hepa_purifier' || a.id === 'diy_box_fan' || a.id === 'n95_respirator') scoreA += 15;
          if (b.id === 'shut_windows_smog' || b.id === 'hepa_purifier' || b.id === 'diy_box_fan' || b.id === 'n95_respirator') scoreB += 15;
        } else if (isPoorOrModerate) {
          if (a.id === 'shut_windows_smog' || a.id === 'move_exercise_indoors' || a.id === 'shift_outdoor_offpeak') scoreA += 10;
          if (b.id === 'shut_windows_smog' || b.id === 'move_exercise_indoors' || b.id === 'shift_outdoor_offpeak') scoreB += 10;
        }
      }

      // Severity bonus
      if (isSevereOrVeryPoor) {
        if (a.id.includes('purifier') || a.id.includes('shut') || a.id.includes('fan') || a.id.includes('n95')) scoreA += 6;
        if (b.id.includes('purifier') || b.id.includes('shut') || b.id.includes('fan') || b.id.includes('n95')) scoreB += 6;
      }
    }
    // Household vulnerable members prioritization
    if (profile.household?.members && profile.household.members.length > 0) {
      if (profile.household.members.includes('pregnant')) {
        if (a.suits.includes('pregnant')) scoreA += isCleanAir ? 18 : 26;
        if (b.suits.includes('pregnant')) scoreB += isCleanAir ? 18 : 26;
      }
      if (profile.household.members.includes('child')) {
        if (a.suits.includes('child')) scoreA += isCleanAir ? 18 : 24;
        if (b.suits.includes('child')) scoreB += isCleanAir ? 18 : 24;
      }
      if (profile.household.members.includes('elderly')) {
        if (a.suits.includes('elderly')) scoreA += isCleanAir ? 18 : 22;
        if (b.suits.includes('elderly')) scoreB += isCleanAir ? 18 : 22;
      }
    }

    // Budget preference ranking
    const budget = profile?.household?.budget;
    const budgetScore = (cost: string) => {
      if (budget === 'free_only') return cost === 'Free' ? 5 : cost === 'Low-cost' ? 2 : 0;
      if (budget === 'low_cost') return cost === 'Low-cost' ? 5 : cost === 'Free' ? 3 : 1;
      return cost === 'If you can afford' ? 5 : cost === 'Low-cost' ? 3 : 2;
    };
    scoreA += budgetScore(a.cost_tier);
    scoreB += budgetScore(b.cost_tier);

    return scoreB - scoreA;
  });
}

export function getTop3Actions(
  profile: UserProfile,
  aqiBandKey: AQIBandKey,
  familyView: FamilyView = 'whole_family'
): ActionItem[] {
  const ranked = getFilteredAndRankedActions(profile, aqiBandKey, familyView)
    .filter((a) => a.evidence_level !== 'Myth');

  const top3: ActionItem[] = [];
  const tiersPicked = new Set<string>();

  // Attempt to select distinct cost tiers if possible: Free, Low-cost, If you can afford
  for (const item of ranked) {
    if (top3.length >= 3) break;
    if (!tiersPicked.has(item.cost_tier)) {
      top3.push(item);
      tiersPicked.add(item.cost_tier);
    }
  }

  // Fill up if fewer than 3
  for (const item of ranked) {
    if (top3.length >= 3) break;
    if (!top3.some((p) => p.id === item.id)) {
      top3.push(item);
    }
  }

  // AUDIENCE CUSTOMIZATION GUARANTEE:
  // For non-whole_family audiences, ensure AT LEAST 1 action in top3 is specifically tailored to that audience
  if (familyView !== 'whole_family' && top3.length > 0) {
    const isTailored = (a: ActionItem) => {
      if (familyView === 'outdoor_worker') {
        return ['cleaner_travel_routes', 'shift_outdoor_offpeak', 'pick_lightest_hour_errands', 'commute_clean_choices', 'n95_respirator'].includes(a.id);
      }
      if (familyView === 'child') {
        return ['bedroom_sanctuary', 'bedroom_door_towel', 'advocate_cleaner_spaces', 'good_day_outdoor_workout', 'move_exercise_indoors'].includes(a.id);
      }
      if (familyView === 'elderly') {
        return ['bedroom_sanctuary', 'bedroom_door_towel', 'shift_outdoor_offpeak', 'pick_lightest_hour_errands', 'good_day_outdoor_workout'].includes(a.id);
      }
      if (familyView === 'pregnant') {
        return ['bedroom_sanctuary', 'shift_outdoor_offpeak', 'n95_respirator', 'pick_lightest_hour_errands', 'bedroom_door_towel'].includes(a.id);
      }
      return false;
    };

    const hasTailored = top3.some(isTailored);
    if (!hasTailored) {
      const bestTailored = ranked.find(isTailored);
      if (bestTailored) {
        top3[top3.length - 1] = bestTailored;
      }
    }
  }

  return top3;
}

export function getActionsForGroup(
  group: ActionGroup,
  familyView: FamilyView = 'whole_family',
  household?: UserProfile['household'],
  aqiBandKey: AQIBandKey = 'poor',
  roomFilter?: string
): ActionItem[] {
  const isCleanAir = aqiBandKey === 'good' || aqiBandKey === 'satisfactory';
  const outdoorInfo = outdoorGuidance(aqiBandKey, null, familyView, { household } as UserProfile);
  let groupActions = ALL_ACTIONS
    .filter((a) => !a.askOnly && a.group === group)
    .filter((a) => outdoorInfo.level === 'go' || !a.outdoorPositive)
    .map((a) => getAdaptiveAction(a, aqiBandKey));

  // Purifier ownership filter:
  // If user has a purifier, hide actions that tell them to buy or make one (e.g. actions with 'noPurifier')
  // If user does NOT have a purifier, hide actions that require an existing purifier
  if (household?.hasPurifier === true) {
    groupActions = groupActions.filter((a) => !a.suits?.includes('noPurifier'));
  } else if (household?.hasPurifier === false) {
    groupActions = groupActions.filter((a) => !a.suits?.includes('hasPurifier') || a.suits?.includes('noPurifier'));
  }

  // Room filtering for Indoors group
  if (group === 'Indoors' && roomFilter && roomFilter !== 'all') {
    groupActions = groupActions.filter((a) => a.room === roomFilter);
  }

  return [...groupActions].sort((a, b) => {
    // Myths always at the bottom
    if (a.evidence_level === 'Myth' && b.evidence_level !== 'Myth') return 1;
    if (b.evidence_level === 'Myth' && a.evidence_level !== 'Myth') return -1;

    let scoreA = 0;
    let scoreB = 0;

    // 1. Direct active persona match
    if (familyView !== 'whole_family') {
      const aMatches = a.suits.includes(familyView);
      const bMatches = b.suits.includes(familyView);
      if (aMatches) scoreA += 40;
      if (bMatches) scoreB += 40;
    }

    if (isCleanAir) {
      if (a.id === 'move_exercise_indoors') scoreA += 35;
      if (b.id === 'move_exercise_indoors') scoreB += 35;
      if (a.id === 'windows_doors_closed') scoreA += 30;
      if (b.id === 'windows_doors_closed') scoreB += 30;

      if (familyView === 'child') {
        if (a.id === 'child_play_school_timing') scoreA += 40;
        if (b.id === 'child_play_school_timing') scoreB += 40;
      } else if (familyView === 'elderly') {
        if (a.id === 'elderly_clean_room') scoreA += 40;
        if (b.id === 'elderly_clean_room') scoreB += 40;
      } else if (familyView === 'pregnant') {
        if (a.id === 'pregnant_avoid_smog_errands' || a.id === 'pregnant_sanctuary_filtration') scoreA += 40;
        if (b.id === 'pregnant_avoid_smog_errands' || b.id === 'pregnant_sanctuary_filtration') scoreB += 40;
      }
    } else {
      // 2. Household vulnerable members prioritization (if selected in Settings)
      if (household && household.members && household.members.length > 0) {
        // Pregnant Person Priority
        if (household.members.includes('pregnant')) {
          if (a.suits.includes('pregnant')) scoreA += 26;
          if (b.suits.includes('pregnant')) scoreB += 26;
          if (a.id === 'pregnant_sanctuary_filtration' || a.id === 'pregnant_avoid_smog_errands') scoreA += 16;
          if (b.id === 'pregnant_sanctuary_filtration' || b.id === 'pregnant_avoid_smog_errands') scoreB += 16;
        }

        // Children & Baby Priority
        if (household.members.includes('child')) {
          if (a.suits.includes('child')) scoreA += 24;
          if (b.suits.includes('child')) scoreB += 24;
          if (a.id === 'child_play_school_timing' || a.id === 'child_clean_bedroom') scoreA += 14;
          if (b.id === 'child_play_school_timing' || b.id === 'child_clean_bedroom') scoreB += 14;
        }

        // Elderly Priority
        if (household.members.includes('elderly')) {
          if (a.suits.includes('elderly')) scoreA += 22;
          if (b.suits.includes('elderly')) scoreB += 22;
          if (a.id === 'elderly_clean_room' || a.id === 'elderly_medication_accessible') scoreA += 14;
          if (b.id === 'elderly_clean_room' || b.id === 'elderly_medication_accessible') scoreB += 14;
        }

        // Asthma / Heart Priority
        if (household.members.includes('asthma_heart')) {
          if (a.suits.includes('asthma') || a.id.includes('purifier') || a.id.includes('closed') || a.id.includes('medication')) scoreA += 18;
          if (b.suits.includes('asthma') || b.id.includes('purifier') || b.id.includes('closed') || b.id.includes('medication')) scoreB += 18;
        }
      }

      // 3. Cooking Fuel Context Prioritization
      if (household?.cookingFuel === 'wood_biomass' || household?.cookingFuel === 'lpg') {
        if (a.id.includes('ventilation') || a.id.includes('kitchen') || a.id.includes('door') || a.id.includes('window')) scoreA += 10;
        if (b.id.includes('ventilation') || b.id.includes('kitchen') || b.id.includes('door') || b.id.includes('window')) scoreB += 10;
      }

      // 4. Budget Preference Prioritization
      if (household?.budget) {
        const budget = household.budget;
        const budgetScore = (cost: string) => {
          if (budget === 'free_only') return cost === 'Free' ? 12 : cost === 'Low-cost' ? 4 : 0;
          if (budget === 'low_cost') return cost === 'Low-cost' ? 12 : cost === 'Free' ? 8 : 2;
          return cost === 'If you can afford' ? 10 : cost === 'Low-cost' ? 6 : 3;
        };
        scoreA += budgetScore(a.cost_tier);
        scoreB += budgetScore(b.cost_tier);
      }
    }

    return scoreB - scoreA;
  });
}

export const getPlanOrderedActions = getActionsForGroup;

// One-line risk note under the ring tailored specifically to that persona
export function getPersonaRiskNote(
  aqiBandKey: AQIBandKey,
  familyView: FamilyView,
  lang: string = 'en'
): string {
  const result = outdoorGuidance(aqiBandKey, null, familyView, undefined, lang);
  if (lang === 'en') {
    return result.guidance;
  }
  return `${result.guidanceNative} (${result.guidance})`;
}

export function calculateWhatIfExposure(
  outdoorPM2_5: number,
  windowsClosed: boolean,
  activeFilter: 'none' | 'hepa' | 'diy_box'
): WhatIfResult {
  const safeOutdoor = Math.max(0, outdoorPM2_5);
  
  // Baseline infiltration: 57.5% (midpoint of 55-60%) when windows are closed; 100% when open
  const infiltrationFactor = windowsClosed ? 0.575 : 1.0;
  
  // Filter reduction factor:
  // HEPA midpoint: 65% (0.65 reduction, meaning 0.35 factor)
  // DIY Box-Fan midpoint: 55% (0.55 reduction, meaning 0.45 factor)
  let filterFactor = 1.0;
  if (activeFilter === 'hepa') {
    filterFactor = 1.0 - 0.65; // 0.35
  } else if (activeFilter === 'diy_box') {
    filterFactor = 1.0 - 0.55; // 0.45
  }

  const indoorPM2_5 = Math.round(safeOutdoor * infiltrationFactor * filterFactor);
  const reductionPercentage = safeOutdoor > 0 
    ? Math.round(((safeOutdoor - indoorPM2_5) / safeOutdoor) * 100) 
    : 0;

  const assumptions = [
    windowsClosed 
      ? 'Windows closed: Outside air leaking in assumed at 57.5% of outdoor PM2.5 (studies show 55-60% baseline penetration without filtration).'
      : 'Windows open: Indoor PM2.5 rapidly equilibrates to 100% of outdoor smog levels.',
    activeFilter === 'hepa'
      ? 'HEPA filter active: Midpoint reduction of 65% applied (based on peer-reviewed 50-80% continuous run trials).'
      : activeFilter === 'diy_box'
      ? 'DIY Box-Fan (MERV-13) active: Midpoint reduction of 55% applied (based on peer-reviewed 40-70% trials).'
      : 'No active air cleaner operating in living space.',
    'Model assumes standard residential room volume with closed room doors and no unvented indoor open flame combustion.',
  ];

  return {
    outdoorPM2_5: safeOutdoor,
    indoorPM2_5,
    reductionPercentage,
    windowsClosed,
    activeFilter,
    assumptions,
  };
}

export function getFallbackNext2Hours(
  aqiBandKey: AQIBandKey,
  familyView: FamilyView,
  lang: string = 'en',
  profile?: Partial<UserProfile>
): string {
  const result = outdoorGuidance(aqiBandKey, null, familyView, profile, lang);
  if (lang === 'en') {
    return result.decision;
  }
  return `${result.decisionNative}\n---EN---\n${result.decision}`;
}
