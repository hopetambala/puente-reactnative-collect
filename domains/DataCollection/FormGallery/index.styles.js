
import { StyleSheet } from "react-native";

const createStyles = (theme) => StyleSheet.create({
  cardContainer: {
    alignItems: "center",
    justifyContent: "center",
    margin: 20,
  },
  textContainer: {
    flexDirection: "row",
  },
  text: {
    flexShrink: 1,
    textAlign: "center",
    color: theme.colors.link,
    fontWeight: "bold",
    marginVertical: 7,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
  },
  mediumHeader: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default createStyles;
