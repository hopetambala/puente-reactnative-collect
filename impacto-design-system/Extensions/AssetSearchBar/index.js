import { getData } from "@modules/async-storage";
import { assetDataQuery } from "@modules/cached-resources/index";
import I18n from "@modules/i18n";
import checkOnlineStatus from "@modules/offline";
import { MOTION_TOKENS } from "@modules/utils/animations";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { Button, Searchbar, Text, useTheme } from "react-native-paper";
import Animated, { Keyframe } from "react-native-reanimated";

import styles from "./index.styles";

// Spec §5.4: search result rows lift in staggered
const AssetRowEntrance = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 8 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }] },
});

function AssetSearchbar({ setSelectedAsset, surveyingOrganization }) {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const [assetData, setAssetData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    checkOnlineStatus().then(async (connected) => {
      if (connected) fetchData(true, "");
      if (!connected) fetchData(false, "");
    });
  }, [surveyingOrganization]);

  // remove this offline portion if he says no offline
  const fetchOfflineData = async () => {
    setOnline(false);

    await getData("assetData").then(() => {
      if (assetData) {
        let offlineData = [];
        getData("offlineAssetIDForms").then((offlineAssetData) => {
          if (offlineAssetData !== null) {
            Object.entries(offlineAssetData).forEach(([, value]) => {
              //eslint-disable-line
              offlineData = offlineData.concat(value.localObject);
            });
          }
          const allData = assetData.concat(offlineData);
          setAssetData(allData.slice() || []);
        });
      }
      setLoading(false);
    });
  };

  const fetchOnlineData = async () => {
    setOnline(true);

    assetDataQuery(surveyingOrganization).then((records) => {
      let offlineData = [];

      getData("offlineAssetIDForms").then((offlineAssetData) => {
        if (offlineAssetData !== null) {
          Object.entries(offlineAssetData).forEach(([, value]) => {
            //eslint-disable-line
            offlineData = offlineData.concat(value.localObject);
          });
        }
      });

      const allData = records.concat(offlineData);
      setAssetData(allData.slice());
      setLoading(false);
    });
  };

  const fetchData = (onLine, qry) => {
    // remove this line if no offline too - 82
    if (!onLine) fetchOfflineData();
    if (onLine) fetchOnlineData(qry);
  };

  // probably not needed, this is all specific to the id form
  const filterOfflineList = () =>
    assetData.filter((listItem) => {
      // const listItemJSON = listItem.toJSON();
      const name = listItem.name || " ";
      return name.toLowerCase().includes(query.toLowerCase());
    });

  const onChangeSearch = (input) => {
    setLoading(true);

    if (input === "") setLoading(false);

    clearTimeout(searchTimeout);

    setQuery(input);

    setSearchTimeout(
      setTimeout(() => {
        fetchData(online, input);
      }, MOTION_TOKENS.duration.pulse)
    );
  };

  const onSelectAsset = (listItem) => {
    setSelectedAsset(listItem);
    setQuery("");
  };

  const renderItem = ({ item, index }) => (
    <Animated.View
      entering={AssetRowEntrance
        .delay(Math.min(index * 40, 200))
        .duration(MOTION_TOKENS.duration.base)}
    >
      <Button
        onPress={() => onSelectAsset(item)}
        contentStyle={{ marginRight: 5 }}
      >
        <Text style={{ marginRight: 10 }}>{item.name}</Text>

        <View
          style={{
            backgroundColor: theme.colors.error,
            width: 1,
            height: 10,
            paddingLeft: 10,
            marginTop: "auto",
            marginBottom: "auto",
            borderRadius: 20,
          }}
        />
      </Button>
    </Animated.View>
  );

  return (
    <View>
      <Text variant="headlineMedium" style={styles.header}>
        {I18n.t("assetSearchbar.searchIndividual")}
      </Text>
      <Searchbar
        placeholder={I18n.t("assetSearchbar.placeholder")}
        onChangeText={onChangeSearch}
        value={query}
      />
      {!online && (
        <Button onPress={() => fetchData(false, "")}>
          {I18n.t("global.refresh")}
        </Button>
      )}
      {loading && <ActivityIndicator color={theme.colors.primary} />}
      {query !== "" && (
        <FlatList
          data={filterOfflineList(assetData)}
          renderItem={renderItem}
          keyExtractor={(item) => item.objectId}
        />
      )}
    </View>
  );
}

export default AssetSearchbar;
