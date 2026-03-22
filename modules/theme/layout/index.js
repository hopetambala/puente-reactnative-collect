import { StyleSheet } from "react-native";

/**
 * Create layout styles dynamically with theme
 * Converts all hardcoded colors to use semantic tokens
 */
// eslint-disable-next-line import/prefer-default-export
export const createLayoutStyles = (theme) => {
  const { colors } = theme;

  return StyleSheet.create({
    /**
     * Container for a Domain Screen
     */
    screenContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    line: {
      flex: 0.5,
      padding: 10,
    },
    /**
     * Styling for rows in a screenContainer where you want elements aligned in a row
     */
    screenFlexRow: {
      marginHorizontal: 20,
      marginBottom: 20,
      alignItems: "flex-start",
      flexDirection: "row",
      backgroundColor: colors.surface,
    },
    /**
     * Styling for rows in a screenContainer where you want elements aligned in a row with wrap
     */
    screenFlexRowWrap: {
      marginHorizontal: 20,
      marginBottom: 20,
      alignItems: "flex-start",
      flexDirection: "row",
      flexWrap: "wrap",
    },
    /**
     * Styling for rows in a screenContainer
     */
    screenRow: {
      flex: 1,
      marginHorizontal: 20,
      marginBottom: 20,
      justifyContent: "center",
      alignItems: "stretch",
    },
    /**
     * Container for a Formik Form
     */
    container: {
      flex: 1,
      backgroundColor: colors.background,
      // alignItems: 'stretch',
      // justifyContent: 'center',
      marginHorizontal: 10,
      marginVertical: 10,
    },
    /**
     * Container for a Formik Form
     */
    formContainer: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "stretch",
      justifyContent: "center",
      marginHorizontal: 10,
    },
    /**
     * Container for a Button Group
     */
    buttonGroupContainer: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 5,
    },
    buttonGroupButtonStyle: {
      marginHorizontal: 5,
      marginVertical: 5,
    },
    /**
     * Style for buttons
     */
    button: {
      // marginLeft: 0,
      // marginRight: 0,
      marginTop: 15,
      marginBottom: 10,
    },
    /**
     * Style for a Small Cards
     */
    // cardSmallStyle: {
    //   height: 90,
    //   width: 90,
    //   justifyContent: 'center',
    //   alignItems: 'center',
    //   marginHorizontal: 5,
    //   marginVertical: 5
    // },
    cardSmallStyle: {
      height: 110,
      width: 150,
      marginHorizontal: 7,
      marginVertical: 7,
    },
    selectLabel: {
      marginTop: 5,
      marginBottom: 10,
    },
    // Style for Search Cards
    resCardContainer: {
      margin: 15,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.surface,
      overflow: "hidden",
    },
    resCardNameContainer: {
      backgroundColor: colors.surfaceRaised,
      marginTop: 15,
      height: 30,
      flexDirection: "row",
    },
    resCardName: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: "bold",
      marginLeft: 15,
      marginTop: "auto",
      marginBottom: "auto",
    },
    resCardNickname: {
      marginLeft: 15,
      marginTop: 5,
      color: colors.textSecondary,
      fontSize: 15,
    },
    resCardProfPic: {
      height: 70,
      width: 70,
      position: "absolute",
      right: 15,
      top: 20,
    },
    resCardCityLicenseContainer: {
      flexDirection: "row",
      marginTop: 40,
      marginBottom: 15,
    },
    resCardCityContainer: {
      flexDirection: "column",
      marginRight: "auto",
      marginLeft: 15,
    },
    resCardLicenseContainer: {
      flexDirection: "column",
      marginLeft: "auto",
      marginRight: 15,
    },
    resCardLicense: {
      marginLeft: "auto",
      color: colors.textSecondary,
      fontSize: 15,
    },
    resCardFont: {
      color: colors.textSecondary,
      fontSize: 15,
    },
    resCardRedCircle: {
      backgroundColor: colors.error,
      width: 15,
      height: 15,
      marginLeft: 10,
      marginTop: "auto",
      marginBottom: "auto",
      borderRadius: 20,
    },
  });
};
