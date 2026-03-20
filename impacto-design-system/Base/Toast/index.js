import * as React from "react";
import { StyleSheet, View } from "react-native";
import { Snackbar } from "react-native-paper";

function Toast({ text, visible, onClick, onClickLabel }) {
  return <View style={styles.container}>
    <Snackbar
      visible={visible}
      onDismiss={onClick}
      duration={3000}
      style={styles.snackbar}
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  snackbar: {
    backgroundColor: "green",
  },
});

export default Toast;
