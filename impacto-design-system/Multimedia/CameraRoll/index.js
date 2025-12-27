import * as ImagePicker from "expo-image-picker";
import I18n from "@modules/i18n";
import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import { Button } from "react-native-paper";

export default function UseCameraRoll({ formikProps, formikKey, setImage }) {
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        await ImagePicker.requestMediaLibraryPermissionsAsync().then(
          (status) => {
            if (status.status !== "granted") {
              // await Permissions.askAsync(Permissions.CAMERA_ROLL)
              alert(I18n.t("camera.sorryAlert")); // eslint-disable-line
            }
          },
          (error) => {
            console.log(error); // eslint-disable-line
          }
        );
        // const { status } = await Permissions.getAsync(Permissions.CAMERA_ROLL)
      }
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true,
    });

    if (!result.cancelled) {
      setImage(result.uri);
      formikProps.setFieldValue(
        formikKey,
        `data:image/jpg;base64,${result.base64}`
      );
    }
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Button onPress={pickImage}>{I18n.t("camera.useImage")}</Button>
    </View>
  );
}
