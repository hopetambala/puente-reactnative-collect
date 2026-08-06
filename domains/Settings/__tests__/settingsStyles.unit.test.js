/**
 * Settings shared style factory - Characterization Tests
 *
 * AS-26: `domains/Settings/index.styles.js` imported the legacy spacing and
 * typography scales, which shadow dlite with different values. This is the
 * shared factory for the whole Settings domain, so migrating it is the
 * highest-leverage token change in the domain.
 *
 * These tests lock the RESOLVED values so the migration is provably
 * pixel-identical. They are written to pass BEFORE the migration and must still
 * pass after -- this is the refactor phase, not red-green: the behaviour does
 * not change, so there is nothing to see fail first.
 *
 * Values captured from the legacy scale: spacing.sm=8, spacing.lg=16,
 * spacing.xxl=32, typography.body1={fontSize:16, lineHeight:24}.
 */

import { createSettingsStyles } from '@app/domains/Settings/index.styles';

const theme = {
  colors: {
    onSurface: '#161616',
    outline: '#d4d4d4',
    primary: '#0a46b6',
  },
};

describe('createSettingsStyles', () => {
  const styles = createSettingsStyles(theme);

  it('keeps body text at 16/24', () => {
    expect(styles.text.fontSize).toBe(16);
    expect(styles.text.lineHeight).toBe(24);
    expect(styles.text.marginVertical).toBe(8);
  });

  it('keeps the divider rules hairline with 8pt breathing room', () => {
    expect(styles.horizontalLineGray.borderBottomWidth).toBe(1);
    expect(styles.horizontalLineGray.marginTop).toBe(8);
    expect(styles.horizontalLineGray.marginBottom).toBe(8);
    expect(styles.horizontalLinePrimary.borderBottomWidth).toBe(1);
  });

  it('keeps container spacing unchanged', () => {
    expect(styles.mainContainer.paddingHorizontal).toBe(16);
    expect(styles.lineContainer.marginBottom).toBe(32);
    expect(styles.languageContainer.paddingTop).toBe(8);
  });

  it('still takes its colours from the live theme', () => {
    expect(styles.text.color).toBe(theme.colors.onSurface);
    expect(styles.horizontalLineGray.borderBottomColor).toBe(theme.colors.outline);
    expect(styles.horizontalLinePrimary.borderBottomColor).toBe(theme.colors.primary);
  });
});
