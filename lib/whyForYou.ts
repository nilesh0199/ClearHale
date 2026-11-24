import type { ActionItem, UserProfile, AirData, AQIBandKey } from '../types';

function getBandKeyFromPM(pm2_5: number): AQIBandKey {
  const safePM = Math.max(0, Math.round(pm2_5));
  if (safePM <= 30) return 'good';
  if (safePM <= 60) return 'satisfactory';
  if (safePM <= 90) return 'moderate';
  if (safePM <= 120) return 'poor';
  if (safePM <= 250) return 'very_poor';
  return 'severe';
}

const BAND_DISPLAY_NAMES: Record<AQIBandKey, string> = {
  good: 'Good band',
  satisfactory: 'Satisfactory band',
  moderate: 'Moderate band',
  poor: 'Poor band',
  very_poor: 'Very Poor band',
  severe: 'Severe band',
};

/**
 * Returns a single short, specific sentence explaining why this action
 * is shown to this specific user right now (not a generic "It cleans air").
 * Falls back cleanly to generic reasoning if profile setup is skipped or default.
 */
export function whyForYou(
  action: ActionItem,
  profile?: UserProfile | null,
  liveData?: AirData | null
): string {
  // If setup was skipped or profile is not completed, provide the generic action reason
  if (!profile || !profile.onboardingCompleted || !profile.household) {
    return action.whyItWorks || action.why || 'A practical step to protect your home against ambient air pollution.';
  }

  const { household } = profile;
  const members = household.members || [];
  const hasChild = (members as string[]).includes('child') || (members as string[]).includes('children');
  const hasElderly = members.includes('elderly');
  const hasPregnant = members.includes('pregnant');
  const hasAsthma =
    (members as string[]).includes('asthma') ||
    members.includes('asthma_heart') ||
    Boolean(household.respiratoryOrHeart);
  const isInfant = household.childAgeBand === 'infant_0_2';
  const hasSchoolRun = Boolean(household.schoolRun);
  const fuel = household.cookingFuel;
  const commute = household.commute || [];
  const ridesTwoWheeler = commute.includes('two_wheeler');
  const walksOrCycles = commute.includes('walk') || commute.includes('cycle');
  const isOutdoorWorker = household.work === 'outdoor';

  const rawBandKey = (liveData?.current as { aqi_band?: string } | undefined)?.aqi_band;
  const bandKey: AQIBandKey | undefined = rawBandKey
    ? (rawBandKey as AQIBandKey)
    : liveData?.current?.pm2_5 !== undefined
    ? getBandKeyFromPM(liveData.current.pm2_5)
    : undefined;
  const bandName = bandKey ? (BAND_DISPLAY_NAMES[bandKey] || `${bandKey} band`) : 'current band';

  // Specific kitchen fuel rules
  if (['kitchen_exhaust_chimney', 'lids_and_pressure_cookers', 'lower_frying_heat', 'switch_to_induction'].includes(action.id)) {
    if (fuel === 'lpg') {
      return `Because you cook on LPG and live air is in the ${bandName}.`;
    }
    if (fuel === 'wood_biomass') {
      return 'Because you cook with biomass fuels and need rapid indoor smoke extraction.';
    }
  }

  if (action.id === 'biomass_ventilation') {
    if (fuel === 'wood_biomass') {
      return 'Because solid cooking fuels release intense smoke that must vent outdoors.';
    }
    return 'Because unvented solid cooking fires create severe indoor smoke spikes.';
  }

  // Outdoor commute & travel rules
  if (action.id === 'commute_clean_choices' || action.id === 'cleaner_travel_routes') {
    if (hasSchoolRun) {
      return 'Because you do the daily school run during morning peak traffic hours.';
    }
    if (ridesTwoWheeler) {
      return 'Because you commute on a two-wheeler and face direct roadside exhaust plumes.';
    }
    if (walksOrCycles) {
      return 'Because active walking or cycling makes you breathe much more outdoor smoke.';
    }
    if (isOutdoorWorker) {
      return 'Because you spend extended working hours navigating city streets.';
    }
  }

  // Outdoor respirators and exercise
  if (action.id === 'n95_respirator' || action.id === 'myth_cloth_masks') {
    if (isInfant) {
      return 'Because infants under 2 cannot safely wear respirators and need indoor protection.';
    }
    if (ridesTwoWheeler) {
      return 'Because you commute on a two-wheeler.';
    }
    if (isOutdoorWorker) {
      return 'Because you work outdoors during peak daytime exposure hours.';
    }
    if (hasAsthma) {
      return 'Because outdoor smoke and tiny dust particles trigger asthma flare-ups.';
    }
    if (hasElderly) {
      return `Because someone in your home is over 60 and outdoor air is in the ${bandName}.`;
    }
    if (hasPregnant) {
      return 'Because expectant mothers require certified filtration against airborne soot.';
    }
  }

  if (
    action.id === 'move_exercise_indoors' ||
    action.id === 'shift_outdoor_offpeak' ||
    action.id === 'pick_lightest_hour_errands'
  ) {
    if (hasElderly) {
      return `Because someone in your home is over 60 and outdoor air is in the ${bandName}.`;
    }
    if (hasChild) {
      return 'Because growing children breathe faster and absorb higher pollution doses.';
    }
    if (hasAsthma) {
      return 'Because heavy outdoor breathing triggers airway spasms and coughing.';
    }
    if (isOutdoorWorker) {
      return 'Because shifting intense exertion avoids the day’s trapped morning smoke.';
    }
    return 'Because running errands during the cleanest window cuts the smoke you breathe.';
  }

  if (action.id === 'good_day_outdoor_workout') {
    return 'Because outdoor air is clean and safe for outdoor exercise today.';
  }

  // Bedroom & sanctuary rules
  if (action.id === 'bedroom_sanctuary' || action.id === 'bedroom_door_towel') {
    if (hasElderly) {
      return `Because someone in your home is over 60 and outdoor air is in the ${bandName}.`;
    }
    if (hasPregnant) {
      return 'Because expectant mothers need a dedicated clean-air sanctuary for sleep.';
    }
    if (hasChild) {
      return 'Because children spend long sleeping hours in their bedroom.';
    }
    if (hasAsthma) {
      return 'Because a clean bedroom prevents nighttime asthma attacks and coughing.';
    }
  }

  if (action.id === 'stop_incense_coils') {
    if (hasAsthma) {
      return 'Because burning dhoop or incense quickly triggers respiratory irritation.';
    }
    if (hasChild || hasPregnant) {
      return 'Because young children and expectant mothers are especially sensitive to indoor smoke.';
    }
  }

  // Purifier maintenance vs purchase
  if (action.id === 'maintain_purifier_filters') {
    return 'Because keeping your purifier filters clean maintains full airflow and dust capture.';
  }

  if (action.id === 'hepa_purifier' || action.id === 'choose_hepa_not_ozone') {
    if (hasAsthma || hasChild || hasElderly) {
      return `Because sensitive lungs in your home benefit from True HEPA filtration in the ${bandName}.`;
    }
    return `Because live air is in the ${bandName} and HEPA filtration cleans the main living space.`;
  }

  if (action.id === 'diy_box_fan') {
    return `Because a DIY MERV-13 fan provides high-efficiency filtration on a modest budget.`;
  }

  // Window shutting & sealing
  if (action.id === 'shut_windows_smog' || action.id === 'seal_gaps_weatherstripping') {
    if (bandKey === 'poor' || bandKey === 'very_poor' || bandKey === 'severe') {
      return `Because live air is in the ${bandName} and outside smoke quickly leaks in through open gaps.`;
    }
    if (hasElderly || hasChild) {
      return 'Because keeping doors and windows shut shields vulnerable family members.';
    }
  }

  if (action.id === 'air_out_cleanest_hour') {
    if (bandKey === 'good' || bandKey === 'satisfactory') {
      return 'Because outdoor air is currently clean enough to air out your home.';
    }
    return 'Because airing out only during the forecast’s cleanest hour prevents heavy soot entry.';
  }

  // Cleaning & living space
  if (action.id === 'damp_mopping_floors') {
    if (hasChild) {
      return 'Because children play close to the floor where settled fine dust gathers.';
    }
    if (hasAsthma) {
      return 'Because damp wiping removes allergens without sweeping them into the air.';
    }
  }

  if (action.id === 'avoid_aerosol_sprays') {
    if (hasAsthma || hasChild) {
      return 'Because aerosol propellants and fragrances trigger bronchial sensitivity.';
    }
  }

  // Community actions
  if (action.id === 'advocate_cleaner_spaces') {
    if (hasChild) {
      return 'Because classroom and school air quality directly impacts your children’s health.';
    }
  }

  if (action.id === 'report_burning_sameer' || action.id === 'stop_waste_burning') {
    return 'Because stopping local open burning keeps smoke plumes away from neighborhood homes.';
  }

  // Myths
  if (action.room === 'community' || action.evidence === 'Myth') {
    return 'Because using evidence-based methods protects your family without wasted expense.';
  }

  // Default personalized sentence referencing live air or household members
  if (bandKey && ['poor', 'very_poor', 'severe'].includes(bandKey)) {
    return `Because live air is in the ${bandName} and proactive protection is recommended.`;
  }

  return action.whyItWorks || action.why || 'A practical step to protect your home against ambient air pollution.';
}
