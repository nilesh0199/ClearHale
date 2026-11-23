export const EMERGENCY_RED_FLAG_PATTERNS = [
  /trouble\s*breathing/i,
  /difficulty\s*breathing/i,
  /can'?t\s*breathe/i,
  /shortness\s*of\s*breath/i,
  /gasping\s*for\s*air/i,
  /chest\s*pain/i,
  /chest\s*tightness/i,
  /pressure\s*in\s*chest/i,
  /blue\s*lips|lips.*blue/i,
  /bluish\s*skin/i,
  /cyanosis/i,
  /confusion/i,
  /unconscious/i,
  /fainting/i,
  /loss\s*of\s*consciousness/i,
  /wheezing\s*severely/i,
  // Hindi transliterations & devanagari
  /सांस\s*लेने\s*में\s*(तकलीफ|दिक्कत|कठिनाई)/i,
  /छाती\s*में\s*दर्द/i,
  /नीले\s*होंठ/i,
  /बेहोश/i,
  /चक्कर\s*आना/i,
  /दम\s*घुट/i,
];

export function hasEmergencySymptoms(text: string): boolean {
  if (!text) return false;
  return EMERGENCY_RED_FLAG_PATTERNS.some((pattern) => pattern.test(text));
}
