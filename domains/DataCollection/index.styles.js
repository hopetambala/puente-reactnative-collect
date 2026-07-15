
import { getTokens } from "@modules/theme/tokens";
import { StyleSheet } from "react-native";

const t = getTokens("light");

export const createStyles = (theme) => StyleSheet.create({
  map: {
    marginVertical: t.tkDliteSemanticSpacing200, // xs ~10px, using 200=8px (closest token)
    marginHorizontal: t.tkDliteSemanticSpacing200, // xs ~10px, using 200=8px (closest token)
  },
  screenFlexRowWrap: {
    marginHorizontal: t.tkDliteSemanticSpacing200, // xs ~10px, using 200=8px (closest token)
    marginBottom: t.tkDliteSemanticSpacing500, // md ~20px, using 500=20px
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
    marginHorizontal: t.tkDliteSemanticSpacing200, // TODO(dlite): 7px has no exact token match, using 200=8px
    marginVertical: t.tkDliteSemanticSpacing200, // TODO(dlite): 7px has no exact token match, using 200=8px
    flex: 1,
  },
  horizontalLine: {
    borderBottomColor: theme.colors.link,
    borderBottomWidth: 1,
    marginVertical: t.tkDliteSemanticSpacing200, // xs ~10px, using 200=8px (closest token)
  },
  userInfoContainer: {
    flexDirection: "row",
  },
  mySurveysContainer: {
    width: "20%",
    marginRight: "auto",
    marginLeft: t.tkDliteSemanticSpacing500, // md ~20px, using 500=20px
  },
  totalSurveysContainer: {
    width: "22%",
    marginLeft: "auto",
    marginRight: t.tkDliteSemanticSpacing500, // md ~20px, using 500=20px
  },

  cardContainer: {
    flexDirection: "row",
  },
  svg: {
    alignSelf: "center",
    marginTop: t.tkDliteSemanticSpacing200, // xs ~10px, using 200=8px (closest token)
    flex: 1,
    width: "100%",
  },
  text: {
    flexShrink: 1,
    textAlign: "center",
    color: theme.colors.link,
    fontWeight: "bold",
    marginVertical: t.tkDliteSemanticSpacing500, // md ~20px, using 500=20px
  },
});

export default createStyles;
