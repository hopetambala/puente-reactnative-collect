import I18n from "@modules/i18n";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Snackbar } from "react-native-paper";

function PopupError({ error, setError, errorMessage }) {
  useEffect(() => {
    setVisible(error);
  }, [error]);

  const [visible, setVisible] = useState(false);

  const dismissSnackBar = () => {
    setVisible(false);
    setError(false);
  };

  return (
    <View>
      <Snackbar
        visible={visible}
        onDismiss={dismissSnackBar}
        duration={6000}
        style={{
          backgroundColor: "red",
          fontSize: 130,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>
          {I18n.t(errorMessage)}
        </Text>
      </Snackbar>
    </View>
  );
}

export default PopupError;
