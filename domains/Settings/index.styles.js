// Default export with light theme for backwards compatibility
import { theme } from "@modules/theme";
import { StyleSheet } from "react-native";

// Factory function to create dynamic styles with theme
export const createSettingsStyles = (appTheme) => StyleSheet.create({
  text: {
    flexShrink: 1,
    fontSize: 16,
    color: appTheme.colors.textSecondary,
    marginVertical: 7,
  },
  horizontalLineGray: {
    borderBottomColor: appTheme.colors.outline,
    borderBottomWidth: 1,
    marginTop: 10,
    marginBottom: 10,
  },
  horizontalLinePrimary: {
    borderBottomColor: appTheme.colors.info,
    borderBottomWidth: 1,
    marginTop: 10,
    marginBottom: 10,
  },
  mainContainer: {
    paddingLeft: "5%",
    paddingRight: "5%",
  },
  lineContainer: {
    marginBottom: 30,
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
    marginTop: -3,
    marginBottom: -5,
  },
  languageContainer: {
    paddingTop: 10,
  },
});
const defaultStyles = createSettingsStyles(theme);
export default defaultStyles;
