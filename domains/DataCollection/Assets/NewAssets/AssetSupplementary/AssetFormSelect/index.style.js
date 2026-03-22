// Default export with light theme for backwards compatibility
import { theme } from "@modules/theme";
import { StyleSheet } from "react-native";

// Factory function to create dynamic styles with theme
export const createAssetFormSelectStyles = (appTheme) => StyleSheet.create({
    cardContainer: {
      alignItems: "center",
      justifyContent: "center",
      margin: 10,
    },
    textContainer: {
      flexDirection: "row",
    },
    text: {
      flexShrink: 1,
      textAlign: "center",
      color: appTheme.colors.primary,
      fontWeight: "bold",
      marginVertical: 7,
    },
    header: {
      fontSize: 20,
      fontWeight: "bold",
    },
    componentContainer: {
      borderRadius: 10,
      backgroundColor: appTheme.colors.surfaceSunken,
      shadowColor: appTheme.colors.onSurface,
      shadowOpacity: 0.8,
      shadowRadius: 2,
      elevation: 5,
    },
  });
const defaultStyles = createAssetFormSelectStyles(theme);
export default defaultStyles;
