import Header from "@impacto-design-system/Extensions/Header";
import { createLayoutStyles } from "@modules/theme";
import I18n from "@modules/i18n";
import * as React from "react";
import { Text, View } from "react-native";
import { useTheme } from "react-native-paper";

export default function DataAnalysis() {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);
  return (
    <View style={layout.screenContainer}>
      <Header />
      <Text>{I18n.t("dataAnalysis.welcome")}</Text>
    </View>
  );
}
