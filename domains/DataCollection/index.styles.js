
import { StyleSheet } from "react-native";

export const createStyles = (theme) => StyleSheet.create({
  map: {
    marginVertical: 10,
    marginHorizontal: 10,
  },
  screenFlexRowWrap: {
    marginHorizontal: 10,
    marginBottom: 20,
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cardInfoContainer: {
    flexDirection: "column",
    flex: 1,
  },
  cardSmallStyle: {
    height: 150,
    marginHorizontal: 7,
    marginVertical: 7,
    flex: 1,
  },
  horizontalLine: {
    borderBottomColor: theme.colors.link,
    borderBottomWidth: 1,
    marginVertical: 10,
  },
  userInfoContainer: {
    flexDirection: "row",
  },
  mySurveysContainer: {
    width: "20%",
    marginRight: "auto",
    marginLeft: 20,
  },
  totalSurveysContainer: {
    width: "22%",
    marginLeft: "auto",
    marginRight: 20,
  },

  cardContainer: {
    flexDirection: "row",
  },
  svg: {
    alignSelf: "center",
    marginTop: 10,
    flex: 1,
    width: "100%",
  },
  text: {
    flexShrink: 1,
    textAlign: "center",
    color: theme.colors.link,
    fontWeight: "bold",
    marginVertical: 20,
  },
});

export default createStyles;
