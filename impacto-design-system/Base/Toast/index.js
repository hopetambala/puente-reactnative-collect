import * as React from "react";
import { StyleSheet, View } from "react-native";
import { Snackbar } from "react-native-paper";

function Toast({ text, visible, onClick, onClickLabel }) {
  return <View style={styles.container}>
    <Snackbar
      visible={visible}
      onDismiss={onClick}
      duration={6000}
      action={{
        label: onClickLabel,
        onPress: () => onClick(),
      }}
    >
      {text}
    </Snackbar>
  </View>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
});

export default Toast;
