import type { AQIBandKey, FamilyView } from '../types';
import { outdoorGuidance } from './outdoorGuidance';

export interface AdviceEntry {
  en: string;
  hi: string;
  mr: string;
}

export function getBandPersonaAdvice(
  bandKey: AQIBandKey = 'poor',
  familyView: FamilyView = 'whole_family',
  lang: string = 'en'
): string {
  const result = outdoorGuidance(bandKey, null, familyView, undefined, lang);
  if (lang === 'hi' || lang === 'mr') {
    return result.guidanceNative || result.guidance;
  }
  return result.guidance;
}

// Band persona advice dictionary derived directly from outdoorGuidance
const BANDS: AQIBandKey[] = ['good', 'satisfactory', 'moderate', 'poor', 'very_poor', 'severe'];
const VIEWS: FamilyView[] = ['whole_family', 'child', 'elderly', 'pregnant', 'outdoor_worker'];

export const BAND_PERSONA_ADVICE: Record<AQIBandKey, Record<FamilyView, AdviceEntry>> = (() => {
  const map: Partial<Record<AQIBandKey, Record<FamilyView, AdviceEntry>>> = {};
  for (const b of BANDS) {
    const vMap: Partial<Record<FamilyView, AdviceEntry>> = {};
    for (const v of VIEWS) {
      const enRes = outdoorGuidance(b, null, v, undefined, 'en');
      const hiRes = outdoorGuidance(b, null, v, undefined, 'hi');
      const mrRes = outdoorGuidance(b, null, v, undefined, 'mr');
      vMap[v] = {
        en: enRes.guidance,
        hi: hiRes.guidanceNative,
        mr: mrRes.guidanceNative,
      };
    }
    map[b] = vMap as Record<FamilyView, AdviceEntry>;
  }
  return map as Record<AQIBandKey, Record<FamilyView, AdviceEntry>>;
})();
