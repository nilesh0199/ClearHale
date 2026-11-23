export type AQIBandKey =
  | 'good'
  | 'satisfactory'
  | 'moderate'
  | 'poor'
  | 'very_poor'
  | 'severe';

export interface AQIBandInfo {
  key: AQIBandKey;
  label: string;
  minPM: number;
  maxPM: number;
  color: string;      // Tailwind text color
  bgColor: string;    // Tailwind chip bg
  borderColor: string;// Tailwind chip border
  ringHex: string;    // Hex code for SVG / canvas ring
  statusLine: string;
  advice: string;
}

export type SupportedLanguage =
  | 'en'
  | 'hi'
  | 'mr'
  | 'bn'
  | 'ta'
  | 'te'
  | 'kn'
  | 'ml'
  | 'gu'
  | 'pa'
  | 'or';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;        // English name
  nativeName: string;  // Native script name
}

export interface CityLocation {
  name: string;
  lat: number;
  lon: number;
  admin?: string;
  country?: string;
}

export type FamilyMember = 'child' | 'elderly' | 'pregnant' | 'asthma_heart';
export type CookingFuel = 'lpg' | 'induction_electric' | 'wood_biomass';
export type CommuteType = 'walk' | 'cycle' | 'bus_metro' | 'two_wheeler' | 'car';
export type WorkType = 'indoor' | 'outdoor';
export type BudgetTier = 'free_only' | 'low_cost' | 'flexible';

export type ChildAgeBand = 'infant_0_2' | 'child_2_12' | 'teen_13_18' | 'none';
export type MaskType = 'n95' | 'cloth' | 'none';
export type CommuteTime = 'morning_peak' | 'evening_peak' | 'off_peak' | 'flexible';
export type PriorityGoal =
  | 'kids_health'
  | 'saving_money'
  | 'understanding_numbers'
  | 'cutting_emissions';

export interface HouseholdProfile {
  members: FamilyMember[];
  cookingFuel: CookingFuel;
  commute: CommuteType[];
  work: WorkType;
  budget: BudgetTier;
  hasPurifier?: boolean;
  childAgeBand?: ChildAgeBand;
  maskType?: MaskType;
  commuteTimes?: CommuteTime[];
  schoolRun?: boolean;
  priorities?: PriorityGoal[];
  respiratoryOrHeart?: boolean;
  intakeCompleted?: boolean;
}

export type FamilyView = 'whole_family' | 'child' | 'elderly' | 'pregnant' | 'outdoor_worker';

export type AppTheme = 'light' | 'dark' | 'system';

export interface VoiceSettings {
  enabled: boolean;          // Voice input on/off (default: true)
  autoSend: boolean;         // Auto-send on/off (default: true)
  autoReadReplies: boolean;  // Read replies aloud automatically (default: false)
  speechRate: number;        // 0.8, 1.0, 1.2 (default: 1.0)
  readBothBilingual: boolean;// Read both native & English in bilingual replies (default: false)
  preferredVoiceURI?: string;// Selected voice URI
}

export type AccentMode = 'teal' | 'mono';

export interface UserProfile {
  city: CityLocation;
  language: SupportedLanguage;
  theme?: AppTheme;
  accentMode?: AccentMode;
  trueBlack?: boolean;
  household: HouseholdProfile;
  activeFamilyFilter: FamilyView;
  checkedActions: string[];
  onboardingCompleted: boolean;
  voice?: VoiceSettings;
  reduceEffects?: boolean;
}

export interface HourlyReading {
  time: string;
  hour: string;
  pm2_5: number;
  pm10: number;
  us_aqi: number;
  isBestHour: boolean;
}

export type AirDataType = 'measured' | 'estimate';

export interface StationInfo {
  id: number;
  name: string;
  provider: string;
  distanceKm: number;
  measuredPM2_5: number;
  measuredPM10: number | null;
  measuredAtUtc: string;
  measuredAtLocal: string;
  minutesAgo: number;
  modelPM2_5: number;
  differencePercent?: number;
  differenceNoted?: boolean;
}

export interface AirData {
  current: {
    pm2_5: number;
    pm10: number;
    us_aqi: number;
    time: string;
    isForecast: boolean;
  };
  hourly: HourlyReading[];
  source: string;
  updatedAt: number;
  isCached: boolean;
  isDemo: boolean;
  dataType?: AirDataType;
  station?: StationInfo | null;
  emptyReason?: string | null;
  modelPM2_5?: number;
}

export type ActionGroup = 'Routines' | 'Indoors' | 'Sustainable swaps';
export type ActionRoom = 'bedroom' | 'kitchen' | 'living' | 'whole-home' | 'outdoors' | 'community';
export type CostTier = 'Free' | 'Low-cost' | 'If you can afford';
export type EvidenceLevel = 'Strong' | 'Moderate' | 'Depends on your home' | 'Limited' | 'Myth';

export interface ActionItem {
  id: string;
  room: ActionRoom;
  title: string;
  doThis: string;
  whyItWorks: string;
  cost_tier: CostTier;
  timeNeeded: string;
  evidence: EvidenceLevel;
  careful: string;
  suits: string[];
  appliesToBands: AQIBandKey[];
  askOnly: boolean;
  source: string;
  group: ActionGroup;
  outdoorPositive?: boolean;

  // Compatibility aliases
  why?: string;
  effect_text?: string;
  evidence_level?: EvidenceLevel;
  safety_note?: string;
  filter_midpoint_reduction?: number | null;
  what_if_type?: 'windows' | 'filter' | null;
  citation?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'emergency';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface WhatIfResult {
  outdoorPM2_5: number;
  indoorPM2_5: number;
  reductionPercentage: number;
  windowsClosed: boolean;
  activeFilter: 'none' | 'hepa' | 'diy_box';
  assumptions: string[];
}
