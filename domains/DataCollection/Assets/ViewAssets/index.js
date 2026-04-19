import { getData, storeData } from "@modules/async-storage";
import { assetDataQuery } from "@modules/cached-resources/read";
import getLocation from "@modules/geolocation";
import React, { createRef, useEffect, useState } from "react";
import { ActivityIndicator , Dimensions, StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { IconButton, useTheme } from "react-native-paper";

import SelectedAsset from "./SelectedAsset";

function ViewAssets({ organization, switchAssetPage }) {
  const theme = useTheme();
  const [region, setRegion] = useState();
  const [delta, setDelta] = useState({
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState();

  const mapView = createRef();

  useEffect(() => {
    let isSubscribed = true;
    async function fetchRegion() {
      await getData("assetMapRegion").then((data) => {
        if (isSubscribed) {
          if (!data) {
            handleLocation();
          } else {
            setRegion(data);
            setDelta(data);
          }
        }
      });
    }

    fetchRegion();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const handleLocation = async () => {
    setLoading(true);
    await getLocation()
      .then((location) => {
        const { latitude, longitude } = location.coords;
        const regionObj = {
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
          latitude,
          longitude,
        };
        setRegion(regionObj);
        setDelta(regionObj);
        storeData(regionObj, "assetMapRegion");
      })
      .catch((e) => {
        console.log(e); //eslint-disable-line
      });
    setLoading(false);
  };

  const retrieveMarkers = () => {
    setLoading(true);
    setDelta({
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
    assetDataQuery(organization)
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

  const setView = (marker) => {
    const { latitude, longitude } = marker;
    const { latitudeDelta, longitudeDelta } = delta;

    const reg = {
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta,
    };

    mapView.current.animateToRegion(reg, 1000);
    setSelectedMarker(marker);
  };

  return (
    <View>
      <View style={styles.container}>
        <MapView style={styles.mapStyle} region={region} ref={mapView}>
          {markers &&
            markers.map(
              (marker) =>
                marker.location && (
                  <Marker
                    key={marker.objectId}
                    coordinate={marker.location}
                    title={`${marker.name || ""}`}
                    // description={`Collector: ${marker.surveyingOr}`}
                    onPress={() => setView(marker)}
                  />
                )
            )}
        </MapView>
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
        {loading && (
          <ActivityIndicator style={styles.loading} color={theme.colors.primary} />
        )}
      </View>
      <View style={styles.container}>
        {selectedMarker && (
          <SelectedAsset
            selectedMarker={selectedMarker}
            style={{ position: "absolute" }}
            switchAssetPage={switchAssetPage}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mapStyle: {
    width: Dimensions.get("window").width * 0.95,
    height: Dimensions.get("window").height * 0.5,
    marginTop: 10,
    borderRadius: 10,
  },
  buttonStyle: {
    position: "absolute", // use absolute position to show button on top of the map
    bottom: "0%",
    right: "0%",
  },
  loading: {
    position: "absolute",
    left: "50%",
    top: "50%",
  },
});

export default ViewAssets;
