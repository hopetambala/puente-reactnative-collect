import ComingSoonSVG from "@assets/graphics/static/Adventurer.svg";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

function Household() {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.container}>
      <View style={styles.centerContainer}>
        <ComingSoonSVG width={200} height={200} />
      </View>
      <View style={styles.centerContainer}>
        <Text style={styles.text}>
          Coming Soon
        </Text>
      </View>
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      margin: 20,
    },
    centerContainer: {
      alignItems: "center",
      marginVertical: 10,
    },
    text: {
      color: theme.colors.textPrimary,
    },
  });

export default Household;
