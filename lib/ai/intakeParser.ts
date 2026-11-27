import type {
  HouseholdProfile,
  FamilyMember,
  ChildAgeBand,
  CookingFuel,
  CommuteType,
  WorkType,
  BudgetTier,
  MaskType,
  PriorityGoal,
} from '../../types';

export const CHIP_PATCH_MAP: Record<string, Partial<HouseholdProfile>> = {
  just_me: { members: [] },
  infant: { members: ['child'], childAgeBand: 'infant_0_2' },
  children: { members: ['child'], childAgeBand: 'child_2_12' },
  elderly: { members: ['elderly'] },
  pregnant: { members: ['pregnant'] },
  asthma_heart: { members: ['asthma_heart'], respiratoryOrHeart: true },
  indoor_work: { work: 'indoor' },
  outdoor_work: { work: 'outdoor' },
  two_wheeler: { commute: ['two_wheeler'] },
  bus_metro: { commute: ['bus_metro'] },
  walk_cycle: { commute: ['walk', 'cycle'] },
  car: { commute: ['car'] },
  school_run: { schoolRun: true },
  peak_hours: { commuteTimes: ['morning_peak', 'evening_peak'] },
  lpg: { cookingFuel: 'lpg' },
  induction: { cookingFuel: 'induction_electric' },
  biomass: { cookingFuel: 'wood_biomass' },
  has_purifier: { hasPurifier: true },
  no_purifier: { hasPurifier: false },
  use_n95: { maskType: 'n95' },
  budget_free: { budget: 'free_only' },
  budget_low_cost: { budget: 'low_cost' },
  budget_flexible: { budget: 'flexible' },
  kids_health: { priorities: ['kids_health'] },
  saving_money: { priorities: ['saving_money'] },
  understanding_numbers: { priorities: ['understanding_numbers'] },
  cutting_emissions: { priorities: ['cutting_emissions'] },
};

export interface IntakeParsedResult {
  patch: Partial<HouseholdProfile>;
  followUpQuestion?: string | null;
  understoodText: string;
}

/**
 * Deterministic rule-based extraction for offline use, unit tests, or AI fallback.
 * Guarantees that intake never fails even if the network or LLM is down.
 */
export function parseWithRules(
  questionId: string,
  userText: string,
  selectedChipIds: string[] = []
): Partial<HouseholdProfile> {
  const patch: Partial<HouseholdProfile> = {};
  const lower = (userText || '').toLowerCase().trim();

  // 1. Incorporate any selected chip patches first
  for (const chipId of selectedChipIds) {
    const chipPatch = CHIP_PATCH_MAP[chipId];
    if (chipPatch) {
      mergeProfilePatch(patch, chipPatch);
    }
  }

  // 2. Keyword matching on free text / speech transcript
  if (lower) {
    // Household members
    const members: FamilyMember[] = [...(patch.members || [])];

    if (/\b(just me|alone|myself|single|only me|live alone|living alone|akela|sirf mai|sirf main|ekla|अकेला|एकला|फक्त मी)\b/i.test(lower)) {
      patch.members = [];
    } else {
      if (/\b(baby|infant|toddler|newborn|navjat|chhota baccha|chota baccha|lahan mool|under 2|नवजात|छोटा बच्चा|लहान मूल)\b/i.test(lower)) {
        if (!members.includes('child')) members.push('child');
        patch.childAgeBand = 'infant_0_2';
      } else if (/\b(child|children|kid|kids|school kid|son|daughter|beta|beti|baccha|bacche|bache|bachhe|chote bacche|बच्चे|मुले)\b/i.test(lower)) {
        if (!members.includes('child')) members.push('child');
        if (!patch.childAgeBand) patch.childAgeBand = 'child_2_12';
      }

      if (/\b(elder|elders|elderly|grandparent|grandparents|parents|mother|father|mom|dad|maa|papa|pitaji|mataji|aai|baba|dada|dadi|nana|nani|in-laws|saas|sasur|senior|senior citizen|60\+|बुजुर्ग|दादा|दादी|आजी|आजोबा)\b/i.test(lower)) {
        if (!members.includes('elderly')) members.push('elderly');
      }

      if (/\b(pregnant|pregnancy|expecting|garbhvati|garodar|गर्भवती|गरोदर)\b/i.test(lower)) {
        if (!members.includes('pregnant')) members.push('pregnant');
      }

      if (/\b(asthma|heart|inhaler|breathing issue|breathing problem|shortness of breath|breathless|respiratory|chest|cough|copd|cardiac|allergy|bronchitis|dama|saans|hryday|दमा|हृदय|श्वास)\b/i.test(lower)) {
        if (!members.includes('asthma_heart')) members.push('asthma_heart');
        patch.respiratoryOrHeart = true;
      }

      if (members.length > 0) {
        patch.members = Array.from(new Set(members));
      }
    }

    // Work environment
    if (/\b(outdoor|outdoors|site|field|traffic|delivery|construction|driver|sales|swiggy|zomato|uber|ola|courier|vendor|security|कन्स्ट्रक्शन|बाहर काम|बाहेर काम)\b/i.test(lower)) {
      patch.work = 'outdoor';
    } else if (/\b(indoor|indoors|office|wfh|home|desk|remote|software|it|bank|teacher|shop|dukan|घर से काम|कार्यालय|ऑफिस)\b/i.test(lower)) {
      patch.work = 'indoor';
    }

    // Commute
    const commute: CommuteType[] = [...(patch.commute || [])];
    if (/\b(two-wheeler|two wheeler|2 wheeler|bike|scooter|scooty|activa|motorcycle|bullet|बाइक|स्कूटर|दुचाकी)\b/i.test(lower)) {
      if (!commute.includes('two_wheeler')) commute.push('two_wheeler');
    }
    if (/\b(bus|metro|train|local|local train|public transit|transit|rail|बस|मेट्रो)\b/i.test(lower)) {
      if (!commute.includes('bus_metro')) commute.push('bus_metro');
    }
    if (/\b(walk|walking|foot|pedestrian|on foot|paidal|payi|पैदल|पायी)\b/i.test(lower)) {
      if (!commute.includes('walk')) commute.push('walk');
    }
    if (/\b(cycle|bicycle|cycling|cycle chalana|saikal|साइकिल|सायकल)\b/i.test(lower)) {
      if (!commute.includes('cycle')) commute.push('cycle');
    }
    if (/\b(car|auto|auto-rickshaw|rickshaw|cab|uber|ola|taxi|drive|driving|van|gadi|गाड़ी|कार)\b/i.test(lower)) {
      if (!commute.includes('car')) commute.push('car');
    }
    if (commute.length > 0) {
      patch.commute = Array.from(new Set(commute));
    }

    // School run & peak hours
    if (/\b(school drop|pickup|school run|drop kids|school|school bus|स्कूल छोड़ना|शाळा)\b/i.test(lower)) {
      patch.schoolRun = true;
    }
    if (/\b(peak|rush hour|morning peak|evening peak|8 am|9 am|10 am|5 pm|6 pm|7 pm|गर्दी|पीक)\b/i.test(lower)) {
      patch.commuteTimes = ['morning_peak', 'evening_peak'];
    }

    // Cooking fuel
    if (/\b(lpg|gas|gas cylinder|gas stove|piped gas|png|cylinder|stovetop|गैस|एलपीजी)\b/i.test(lower)) {
      patch.cookingFuel = 'lpg';
    } else if (/\b(induction|electric|electric stove|heater|विद्युत|इंडक्शन)\b/i.test(lower)) {
      patch.cookingFuel = 'induction_electric';
    } else if (/\b(wood|biomass|chulha|coal|kerosene|cow dung|uple|lakdi|लकड़ी|चूल्हा|शेणी)\b/i.test(lower)) {
      patch.cookingFuel = 'wood_biomass';
    }

    // Equipment
    if (/\b(have a purifier|have an air purifier|have purifier|got a purifier|own a purifier|have air purifier|yes purifier|use purifier|purifier hai|air purifier hai|hepa|air filter|प्यूरीफायर है|प्युरिफायर आहे)\b/i.test(lower)) {
      patch.hasPurifier = true;
    } else if (/\b(no purifier|no air purifier|don't have purifier|don't have air purifier|do not have purifier|do not have air purifier|no filter|purifier nahi hai|air purifier nahi|प्यूरीफायर नहीं|प्युरिफायर नाही)\b/i.test(lower)) {
      patch.hasPurifier = false;
    }

    if (/\b(n95|n-95|respirator|kn95|ffp2|pollution mask)\b/i.test(lower)) {
      patch.maskType = 'n95';
    } else if (/\b(cloth|cloth mask|cotton|surgical|gamcha|rumal|handkerchief|गमछा|रूमाल)\b/i.test(lower)) {
      patch.maskType = 'cloth';
    }

    // Budget
    if (/\b(free|zero cost|no money|0|cheap|no spend|no expense|muft|mofat|मुफ़्त|मोफत)\b/i.test(lower)) {
      patch.budget = 'free_only';
    } else if (/\b(low-cost|low cost|diy|affordable|moderate|kam kharcha|kifayati|किफायती|कमी खर्च)\b/i.test(lower)) {
      patch.budget = 'low_cost';
    } else if (/\b(flexible|can afford|no constraint|high|premium|budget not an issue|paisa koi problem nahi|बजट की चिंता नहीं|लवचिक)\b/i.test(lower)) {
      patch.budget = 'flexible';
    }

    // Priorities
    const priorities: PriorityGoal[] = [...(patch.priorities || [])];
    if (/\b(kid|kids|child|children|baby|son|daughter|family|बच्चे|मुले)\b/i.test(lower) && !priorities.includes('kids_health')) {
      priorities.push('kids_health');
    }
    if (/\b(money|cost|cheap|saving|budget|paisa|पैसे|किफायत)\b/i.test(lower) && !priorities.includes('saving_money')) {
      priorities.push('saving_money');
    }
    if (/\b(number|numbers|aqi|pm2.5|safe hours|forecast|data|आंकड़े|नियम)\b/i.test(lower) && !priorities.includes('understanding_numbers')) {
      priorities.push('understanding_numbers');
    }
    if (/\b(smoke|emission|green|environment|pollution|clean air|धुआं|प्रदूषण)\b/i.test(lower) && !priorities.includes('cutting_emissions')) {
      priorities.push('cutting_emissions');
    }
    if (priorities.length > 0) {
      patch.priorities = Array.from(new Set(priorities));
    }
  }

  return patch;
}

/**
 * Safely merges a partial profile patch into a target profile
 */
export function mergeProfilePatch(
  target: Partial<HouseholdProfile>,
  patch: Partial<HouseholdProfile>
): Partial<HouseholdProfile> {
  if (patch.members) {
    if (patch.members.length === 0) {
      target.members = [];
    } else {
      target.members = Array.from(new Set([...(target.members || []), ...patch.members]));
    }
  }
  if (patch.childAgeBand !== undefined) target.childAgeBand = patch.childAgeBand;
  if (patch.respiratoryOrHeart !== undefined) target.respiratoryOrHeart = patch.respiratoryOrHeart;
  if (patch.cookingFuel !== undefined) target.cookingFuel = patch.cookingFuel;
  if (patch.commute) {
    target.commute = Array.from(new Set([...(target.commute || []), ...patch.commute]));
  }
  if (patch.work !== undefined) target.work = patch.work;
  if (patch.budget !== undefined) target.budget = patch.budget;
  if (patch.hasPurifier !== undefined) target.hasPurifier = patch.hasPurifier;
  if (patch.maskType !== undefined) target.maskType = patch.maskType;
  if (patch.schoolRun !== undefined) target.schoolRun = patch.schoolRun;
  if (patch.commuteTimes) {
    target.commuteTimes = Array.from(new Set([...(target.commuteTimes || []), ...patch.commuteTimes]));
  }
  if (patch.priorities) {
    target.priorities = Array.from(new Set([...(target.priorities || []), ...patch.priorities]));
  }
  return target;
}

export interface ProfileUpdateProposal {
  label: string;
  patch: Partial<HouseholdProfile>;
}

/**
 * Detects if a chat query indicates a change to the user's existing household profile.
 * Proposes a chip for user confirmation so nothing changes silently.
 */
export function detectProfileChangeInMessage(
  message: string,
  current: HouseholdProfile = { members: [], cookingFuel: 'lpg', commute: [], work: 'indoor', budget: 'low_cost' }
): ProfileUpdateProposal | null {
  if (!message || typeof message !== 'string') return null;
  const lower = message.toLowerCase().trim();

  // Purifier acquisition
  if (
    /\b(bought a purifier|got a purifier|purchased a purifier|have a purifier now|प्यूरीफायर खरीद|प्युरिफायर घेतला)\b/i.test(
      lower
    ) &&
    current.hasPurifier !== true
  ) {
    return {
      label: 'Update: Has air purifier',
      patch: { hasPurifier: true },
    };
  }

  // N95 masks
  if (
    /\b(bought n95|got n95|using n95|wear n95|n95 mask लिया)\b/i.test(lower) &&
    current.maskType !== 'n95'
  ) {
    return {
      label: 'Update: Uses N95 masks',
      patch: { maskType: 'n95' },
    };
  }

  // Infant arrival
  if (
    /\b(had a baby|have an infant|newborn at home|छोटा बच्चा हुआ)\b/i.test(lower) &&
    current.childAgeBand !== 'infant_0_2'
  ) {
    const members = Array.from(new Set([...(current.members || []), 'child' as const]));
    return {
      label: 'Update: Infant at home',
      patch: { members, childAgeBand: 'infant_0_2' },
    };
  }

  // Switched to induction
  if (
    /\b(switched to induction|bought induction|cooking on induction|इंडक्शन ले लिया)\b/i.test(lower) &&
    current.cookingFuel !== 'induction_electric'
  ) {
    return {
      label: 'Update: Induction cooking',
      patch: { cookingFuel: 'induction_electric' },
    };
  }

  // Two-wheeler commute
  if (
    /\b(started riding bike|commute by bike|started riding scooter|बाइक से जाना शुरू)\b/i.test(lower) &&
    !current.commute?.includes('two_wheeler')
  ) {
    const commute = Array.from(new Set([...(current.commute || []), 'two_wheeler' as const]));
    return {
      label: 'Update: Two-wheeler commute',
      patch: { commute },
    };
  }

  // Outdoor work
  if (
    /\b(started working outdoors|got outdoor job|फील्ड वर्क शुरू)\b/i.test(lower) &&
    current.work !== 'outdoor'
  ) {
    return {
      label: 'Update: Outdoor work',
      patch: { work: 'outdoor' },
    };
  }

  return null;
}
