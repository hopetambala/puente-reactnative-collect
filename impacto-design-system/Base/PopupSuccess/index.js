import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Snackbar } from "react-native-paper";

// import I18n from '@modules/i18n';

function PopupSuccess({ success, setSuccess, submittedForms }) {
  useEffect(() => {
    setVisible(success);
  }, [success]);

  const [visible, setVisible] = useState(false);

  const dismissSnackBar = () => {
    setVisible(false);
    setSuccess(false);
  };

  return (
    <View>
      <Snackbar
        visible={visible}
        onDismiss={dismissSnackBar}
        duration={6000}
        style={{
          backgroundColor: "green",
          fontSize: 130,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>
          {submittedForms} Records Successfully Stored!
        </Text>
      </Snackbar>
    </View>
  );
}

export default PopupSuccess;
