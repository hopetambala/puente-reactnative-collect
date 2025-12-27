import { getData } from "@modules/async-storage";
import { assetDataQuery } from "@modules/cached-resources/index";
import I18n from "@modules/i18n";
import checkOnlineStatus from "@modules/offline";
import React, { useEffect, useState } from "react";
import { ActivityIndicator , FlatList, Text, View } from "react-native";
import { Button, Headline, Searchbar } from "react-native-paper";

import styles from "./index.styles";

function AssetSearchbar({ setSelectedAsset, surveyingOrganization }) {
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
      }, 1000)
    );
  };

  const onSelectAsset = (listItem) => {
    setSelectedAsset(listItem);
    setQuery("");
  };

  const renderItem = ({ item }) => (
    <View>
      <Button
        onPress={() => onSelectAsset(item)}
        contentStyle={{ marginRight: 5 }}
      >
        <Text style={{ marginRight: 10 }}>{item.name}</Text>

        <View
          style={{
            backgroundColor: "#f8380e",
            width: 1,
            height: 10,
            paddingLeft: 10,
            marginTop: "auto",
            marginBottom: "auto",
            borderRadius: 20,
          }}
        />
      </Button>
    </View>
  );

  return (
    <View>
      <Headline style={styles.header}>
        {I18n.t("assetSearchbar.searchIndividual")}
      </Headline>
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
      {loading && <ActivityIndicator color="blue" />}
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
