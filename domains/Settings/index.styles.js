// Factory function to create dynamic styles with theme.
//
// AS-26: migrated off the legacy spacing/typography scales, which shadow dlite
// with different values (legacy spacing.md=12 vs tkDliteSemanticSpacingMd=16).
// Every value this file used mapped exactly onto a dlite token, so the migration
// is pixel-identical -- locked by domains/Settings/__tests__/settingsStyles.unit.test.js.
//
// Module scope is safe here: only spacing and type are read from the token
// object, and those are identical in light and dark. Colours still come from the
// live theme passed in by the caller.
import { getTokens } from "@modules/theme/tokens";
import { StyleSheet } from "react-native";

const t = getTokens("light");

// The type ramp expresses line height as a ratio, not pixels, so compose it.
// Size400 (16) * BodyDefaultLineHeight (1.5) = 24.
const BODY_FONT_SIZE = t.tkDliteSemanticTypographySize400;
const BODY_LINE_HEIGHT =
  BODY_FONT_SIZE * t.tkDliteSemanticTypographyTypeBodyDefaultLineHeight;

export const createSettingsStyles = (appTheme) => StyleSheet.create({
  text: {
    flexShrink: 1,
    fontSize: BODY_FONT_SIZE,
    fontWeight: String(t.tkDliteSemanticTypographyTypeBodyDefaultWeight),
    lineHeight: BODY_LINE_HEIGHT,
    // TODO(dlite): the body ramp specifies letterSpacing "0em", a CSS string
    // that does not drop into a React Native style, and the legacy scale used
    // 0.5. Preserving 0.5 keeps this migration pixel-identical; reconcile the
    // token to a numeric RN value and drop this literal.
    letterSpacing: 0.5,
    color: appTheme.colors.onSurface,
    marginVertical: t.tkDliteSemanticSpacing200,
  },
  horizontalLineGray: {
    borderBottomColor: appTheme.colors.outline,
    borderBottomWidth: t.tkDliteSemanticSpacingXxxs,
    marginTop: t.tkDliteSemanticSpacing200,
    marginBottom: t.tkDliteSemanticSpacing200,
  },
  horizontalLinePrimary: {
    borderBottomColor: appTheme.colors.primary,
    borderBottomWidth: t.tkDliteSemanticSpacingXxxs,
    marginTop: t.tkDliteSemanticSpacing200,
    marginBottom: t.tkDliteSemanticSpacing200,
  },
  mainContainer: {
    paddingHorizontal: t.tkDliteSemanticSpacing400,
  },
  lineContainer: {
    marginBottom: t.tkDliteSemanticSpacing800,
  },
  textContainer: {
    flexDirection: "row",
  },
  buttonContainer: {
    flexDirection: "row",
    marginLeft: "auto",
    marginTop: "auto",
    marginBottom: "auto",
    flex: 1,
  },
  svg: {
    marginLeft: "auto",
  },
  languageContainer: {
    paddingTop: t.tkDliteSemanticSpacing200,
  },
});

export default createSettingsStyles;
