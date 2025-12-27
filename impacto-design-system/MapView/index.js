import { residentIDQuery } from "@app/services/parse/crud";
import { getData, storeData } from "@modules/async-storage";
import getLocation from "@modules/geolocation";
import { theme } from "@modules/theme";
import { ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { IconButton } from "react-native-paper";

const Maps = ({ organization }) => {
  useEffect(() => {
    let isSubscribed = true;

    async function fetchRegion() {
      await getData("homeMapRegion").then((data) => {
        if (isSubscribed) {
          if (!data) {
            handleLocation();
          } else {
            setRegion(data);
          }
        }
      });
    }

    fetchRegion();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const [region, setRegion] = useState();
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleLocation = async () => {
    setLoading(true);
    try {
      const location = await getLocation();
      if (!location) return;
      const { latitude, longitude } = location.coords;
      setRegion({
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
        latitude,
        longitude,
      });
      storeData(
        {
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
          latitude,
          longitude,
        },
        "homeMapRegion"
      );
      setLoading(false);
    } catch (err) {
      console.log("MapView", err); //eslint-disable-line
      setLoading(false);
    }
  };

  const retrieveMarkers = () => {
    setLoading(true);
    const queryParams = {
      skip: 0,
      offset: 0,
      limit: 10000,
      parseColumn: "surveyingOrganization",
      parseParam: organization,
    };
    residentIDQuery(queryParams)
      .then((records) => {
        const sanitizedRecords = JSON.parse(JSON.stringify(records));
        setMarkers(sanitizedRecords);
        setLoading(false);
      })
      .catch((e) => {
        setLoading(false);
        console.log(e); //eslint-disable-line
      });
  };

  // const retriveAsyncMarkers = () => {
  //   setLoading(true);
  //   getData('residentData').then((residentData) => {
  //     if (residentData) {
  //       setMarkers(residentData);
  //     }
  //     setLoading(false);
  //   });
  // };

  // const retrieveOnlineMarkers = () => {
  //   setLoading(true);
  // const queryParams = {
  //   skip: 0,
  //   offset: 0,
  //   limit: 10000,
  //   parseColumn: 'surveyingOrganization',
  //   parseParam: organization,
  // };

  //   residentIDQuery(queryParams).then((recs) => {
  //     const records = JSON.parse(JSON.stringify(recs));
  //     setMarkers(records);
  //     setLoading(false);
  //   });
  // };

  return (
    <View style={styles.container}>
      <MapView style={styles.mapStyle} region={region}>
        {markers &&
          markers.map(
            (marker) =>
              marker.location && (
                <Marker
                  key={marker.objectId}
                  coordinate={marker.location}
                  title={`${marker.fname || ""} ${marker.lname || ""}`}
                  description={`Collector: ${marker.surveyingUser}`}
                />
              )
          )}
      </MapView>
      {loading && (
        <ActivityIndicator style={styles.loading} color={theme.colors.primary} />
      )}
      <View style={styles.buttonStyle}>
        <IconButton
          icon="crosshairs-gps"
          onPress={handleLocation}
          color={theme.colors.primary}
          style={{ backgroundColor: theme.colors.background, opacity: 0.8 }}
        />
        <IconButton
          icon="refresh"
          onPress={retrieveMarkers}
          color={theme.colors.primary}
          style={{ backgroundColor: theme.colors.background, opacity: 0.8 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mapStyle: {
    width: Dimensions.get("window").width * 0.95,
    height: Dimensions.get("window").height / 2,
    marginTop: 10,
    borderRadius: 10,
  },
  buttonStyle: {
    position: "absolute", // use absolute position to show button on top of the map
    bottom: "0%",
    alignSelf: "flex-end", // for align to right,
    right: 10,
  },
  loading: {
    position: "absolute",
    left: "50%",
    top: "50%",
  },
});

export default Maps;
