import { Button as PaperButton, PopupError } from "@impacto-design-system/Base";
import getLocation from "@modules/geolocation";
import I18n from "@modules/i18n";
import { fulfillWithTimeLimit } from "@modules/utils";
import React, { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

function Geolocation({ errors, formikKey, setFieldValue }) {
  const theme = useTheme();
  const [location, setLocation] = useState({
    latitude: 0,
    longitude: 0,
    altitude: 0,
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState(false);

  const handleLocation = async () => {
    setLocationLoading(true);

    const locationPromise = new Promise((resolve, reject) => {
      try {
        getLocation().then((value) => resolve(value));
      } catch (e) {
        reject(e);
      }
    });

    const currentLocation = await fulfillWithTimeLimit(
      20000,
      locationPromise,
      null
    );

    if (currentLocation.timedOut || currentLocation.error || !currentLocation.value) {
      setFieldValue("location", { latitude: 0, longitude: 0, altitude: 0 });
      setLocationLoading(false);
      setSubmissionError(true);
    } else {
      const { latitude, longitude, altitude } = currentLocation.value.coords;
      setFieldValue("location", { latitude, longitude, altitude });
      setLocation({ latitude, longitude, altitude });
      setLocationLoading(false);
    }
  };
  return (
    <View key={formikKey}>
      {location === null && (
        <PaperButton
          onPress={handleLocation}
          buttonText={I18n.t("paperButton.getLocation")}
        />
      )}
      {location !== null && (
        <View>
          <PaperButton
            onPress={handleLocation}
            buttonText={I18n.t("paperButton.getLocationAgain")}
          />
          <View
            style={{
              marginLeft: "auto",
              marginRight: "auto",
              flexDirection: "row",
            }}
          >
            {locationLoading === true && (
              <ActivityIndicator color={theme.colors.primary} />
            )}
            {locationLoading === false && (
              <View>
                <Text variant="headlineMedium">
                  {`(${location.latitude.toFixed(
                    2
                  )}, ${location.longitude.toFixed(2)})`}
                </Text>
              </View>
            )}
          </View>
          <Text style={{ color: theme.colors.error }}>{errors[formikKey]}</Text>
        </View>
      )}
      <PopupError
        error={submissionError}
        setError={setSubmissionError}
        errorMessage="submissionError.geolocation"
      />
    </View>
  );
}

export default Geolocation;
