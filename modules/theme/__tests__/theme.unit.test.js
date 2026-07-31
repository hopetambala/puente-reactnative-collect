/**
 * Theme colour mapping - Unit Tests
 *
 * AS-25 (RED): `secondaryContainer` / `onSecondaryContainer` are never mapped in
 * createTheme, so Paper's SegmentedButtons falls back to the MD3 baseline
 * lavender (#E8DEF8). Visible in .claude/screenshots/08-settings.png as a purple
 * Theme selector among otherwise-blue controls.
 *
 * AS-21 (RED): the colour mapped to `primary` fails WCAG AA in light mode, in
 * BOTH directions -- as a label on the app background, and as the surface under
 * white `onPrimary` text. Contrast is symmetric, so text buttons and contained
 * buttons are equally affected.
 */

import { createTheme } from '@modules/theme';

const hexToRgb = (hex) => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
};

const relativeLuminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const channel = v / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrastRatio = (a, b) => {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const WCAG_AA_BODY_TEXT = 4.5;

describe('createTheme colour mapping', () => {
  describe('AS-25 SegmentedButtons container', () => {
    it('maps secondaryContainer so Paper does not fall back to MD3 lavender', () => {
      const { colors } = createTheme('light');

      expect(colors.secondaryContainer).toBeDefined();
      expect(colors.secondaryContainer.toLowerCase()).not.toBe('#e8def8');
    });

    it('maps a readable onSecondaryContainer for the selected segment label', () => {
      const { colors } = createTheme('light');

      expect(colors.onSecondaryContainer).toBeDefined();
      expect(
        contrastRatio(colors.onSecondaryContainer, colors.secondaryContainer)
      ).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
    });
  });

  describe('AS-21 primary action contrast in light mode', () => {
    it('is readable as a text-button label on the app background', () => {
      const { colors } = createTheme('light');

      expect(contrastRatio(colors.primary, colors.background)).toBeGreaterThanOrEqual(
        WCAG_AA_BODY_TEXT
      );
    });

    it('is readable as a contained-button surface under onPrimary text', () => {
      const { colors } = createTheme('light');

      expect(contrastRatio(colors.onPrimary, colors.primary)).toBeGreaterThanOrEqual(
        WCAG_AA_BODY_TEXT
      );
    });
  });
});
