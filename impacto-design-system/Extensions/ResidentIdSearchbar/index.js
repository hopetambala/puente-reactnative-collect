import { OfflineContext } from "@context/offline.context";
import ResidentCard from "@impacto-design-system/Extensions/FindResidents/Resident/ResidentCard";
import { getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import checkOnlineStatus from "@modules/offline";
import React, { useContext, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { Button, Searchbar, Text, useTheme } from "react-native-paper";

import parseSearch from "./utils";

function ResidentIdSearchbar({
  surveyee,
  setSurveyee,
  surveyingOrganization,
}) {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const [residentsData, setResidentsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const { residentOfflineData } = useContext(OfflineContext);

  useEffect(() => {
    checkOnlineStatus().then(async (connected) => {
      if (connected) fetchData(true, "");
      if (!connected) fetchData(false, "");
    });
  }, [surveyingOrganization]);

  const fetchOfflineData = async () => {
    setOnline(false);

    return residentOfflineData().then((residents) => {
      setResidentsData(residents);
      setLoading(false);
    });
  };

  const fetchOnlineData = async (qry) => {
    setOnline(true);

    const records = await parseSearch(surveyingOrganization, qry);

    let offlineData = [];

    await getData("offlineIDForms").then((offlineResidentData) => {
      if (offlineResidentData !== null) {
        Object.entries(offlineResidentData).forEach(([, value]) => {
          //eslint-disable-line
          offlineData = offlineData.concat(value.localObject);
        });
      }
    });

    const allData = records.concat(offlineData);
    setResidentsData(allData.slice());
    setLoading(false);
  };

  const fetchData = (onLine, qry) => {
    if (!onLine) fetchOfflineData();
    if (onLine) fetchOnlineData(qry);
  };

  const filterOfflineList = () =>
    residentsData.filter((listItem) => {
      const fname = listItem.fname || " ";
      const lname = listItem.lname || " ";
      const nickname = listItem.nickname || " ";
      return (
        fname.toLowerCase().includes(query.toLowerCase()) ||
        lname.toLowerCase().includes(query.toLowerCase()) ||
        `${fname} ${lname}`.toLowerCase().includes(query.toLowerCase()) ||
        nickname.toLowerCase().includes(query.toLowerCase())
      );
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

  const onSelectSurveyee = (listItem) => {
    setSurveyee(listItem);
    setQuery("");
  };

  const renderItem = ({ item }) => (
    <View>
      <Button
        onPress={() => onSelectSurveyee(item)}
        contentStyle={{ marginRight: 5 }}
      >
        <Text style={{ marginRight: 10 }}>{`${item?.fname || ""} ${
          item?.lname || ""
        }`}</Text>
        {/* offline IDform */}
        {item.objectId.includes("PatientID-") && (
          <View
            style={{
              backgroundColor: theme.colors.secondary,
              width: 1,
              height: 10,
              paddingLeft: 10,
              marginTop: "auto",
              marginBottom: "auto",
              borderRadius: 20,
            }}
          />
        )}
      </Button>
    </View>
  );

  return (
    <View>
      <Searchbar
        placeholder={I18n.t("findResident.typeHere")}
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
          data={online ? residentsData : filterOfflineList(residentsData)}
          renderItem={renderItem}
          keyExtractor={(item) => item.objectId}
        />
      )}

      {surveyee && surveyee.objectId && <ResidentCard resident={surveyee} />}
    </View>
  );
}

export default ResidentIdSearchbar;
