import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * WCAG 2.1 Contrast Calculator
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function hexToRgb(hex) {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function sRGBtoLin(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * sRGBtoLin(r) + 0.7152 * sRGBtoLin(g) + 0.0722 * sRGBtoLin(b);
}

export function getContrastRatio(hex1, hex2) {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Design Tokens under test
const LIGHT = {
  pageBg: '#FAFAFA',
  surface: '#FFFFFF',
  subtleFill: '#F5F5F5',
  primaryText: '#171717',
  secondaryText: '#525252',
  tertiaryText: '#737373',
};

const DARK = {
  pageBg: '#0A0A0A',
  pageBgTrueBlack: '#000000',
  surface: '#171717',
  subtleFill: '#262626',
  primaryText: '#F5F5F5',
  secondaryText: '#A3A3A3',
  tertiaryText: '#8A8A8A',
};

test('WCAG 2.1 Contrast Audit: Light Mode', async (t) => {
  const bgPairs = [
    { name: 'pageBg (#FAFAFA)', hex: LIGHT.pageBg },
    { name: 'surface (#FFFFFF)', hex: LIGHT.surface },
    { name: 'subtleFill (#F5F5F5)', hex: LIGHT.subtleFill },
  ];

  for (const bg of bgPairs) {
    await t.test(`Primary text against ${bg.name}`, () => {
      const ratio = getContrastRatio(LIGHT.primaryText, bg.hex);
      assert.ok(
        ratio >= 7.0,
        `Primary text on ${bg.name} must be >= 7:1 (AAA), got ${ratio.toFixed(2)}:1`
      );
    });

    await t.test(`Secondary text against ${bg.name}`, () => {
      const ratio = getContrastRatio(LIGHT.secondaryText, bg.hex);
      assert.ok(
        ratio >= 4.5,
        `Secondary text on ${bg.name} must be >= 4.5:1 (AA), got ${ratio.toFixed(2)}:1`
      );
    });

    await t.test(`Tertiary text against ${bg.name} (large/non-essential text only)`, () => {
      const ratio = getContrastRatio(LIGHT.tertiaryText, bg.hex);
      assert.ok(
        ratio >= 3.0,
        `Tertiary text on ${bg.name} must be >= 3:1 (Large text AA), got ${ratio.toFixed(2)}:1`
      );
    });
  }
});

test('WCAG 2.1 Contrast Audit: Dark Mode (Default #0A0A0A & True Black #000000)', async (t) => {
  const bgPairs = [
    { name: 'pageBg (#0A0A0A)', hex: DARK.pageBg },
    { name: 'pageBgTrueBlack (#000000)', hex: DARK.pageBgTrueBlack },
    { name: 'surface (#171717)', hex: DARK.surface },
    { name: 'subtleFill (#262626)', hex: DARK.subtleFill },
  ];

  for (const bg of bgPairs) {
    await t.test(`Primary text against ${bg.name}`, () => {
      const ratio = getContrastRatio(DARK.primaryText, bg.hex);
      assert.ok(
        ratio >= 7.0,
        `Primary text on ${bg.name} must be >= 7:1 (AAA), got ${ratio.toFixed(2)}:1`
      );
    });

    await t.test(`Secondary text against ${bg.name}`, () => {
      const ratio = getContrastRatio(DARK.secondaryText, bg.hex);
      assert.ok(
        ratio >= 4.5,
        `Secondary text on ${bg.name} must be >= 4.5:1 (AA), got ${ratio.toFixed(2)}:1`
      );
    });

    await t.test(`Tertiary text against ${bg.name} (large/non-essential text only)`, () => {
      const ratio = getContrastRatio(DARK.tertiaryText, bg.hex);
      assert.ok(
        ratio >= 3.0,
        `Tertiary text on ${bg.name} must be >= 3:1 (Large text AA), got ${ratio.toFixed(2)}:1`
      );
    });
  }
});

test('Accent Mode Contrast Verification', () => {
  // Teal on light surface
  const tealLightOnSurface = getContrastRatio('#0D5C52', LIGHT.surface);
  assert.ok(tealLightOnSurface >= 4.5, `Teal light (#0D5C52) must be >= 4.5:1 on white, got ${tealLightOnSurface.toFixed(2)}:1`);

  // Mint on dark surface
  const mintDarkOnSurface = getContrastRatio('#2DD4BF', DARK.surface);
  assert.ok(mintDarkOnSurface >= 4.5, `Mint dark (#2DD4BF) must be >= 4.5:1 on dark surface, got ${mintDarkOnSurface.toFixed(2)}:1`);

  // Mono Primary Button Text Contrast
  const lightBtnContrast = getContrastRatio('#171717', '#FFFFFF');
  assert.ok(lightBtnContrast >= 7.0, `Mono light button must be >= 7:1, got ${lightBtnContrast.toFixed(2)}:1`);

  const darkBtnContrast = getContrastRatio('#F5F5F5', '#0A0A0A');
  assert.ok(darkBtnContrast >= 7.0, `Mono dark button must be >= 7:1, got ${darkBtnContrast.toFixed(2)}:1`);
});
