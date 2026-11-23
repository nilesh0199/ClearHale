/**
 * Clearhale Theme System
 * Exports design tokens and accent configuration.
 */

export * from './tokens';
import { AccentMode } from './tokens';

export const DEFAULT_ACCENT: AccentMode = 'teal';

export function isThemeExperimentEnabled(): boolean {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NEXT_PUBLIC_THEME_EXPERIMENT === 'true';
  }
  return false;
}
