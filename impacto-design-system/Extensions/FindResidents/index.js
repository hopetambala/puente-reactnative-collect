import { OfflineContext } from "@context/offline.context";
import { getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import checkOnlineStatus from "@modules/offline";
import { MOTION_TOKENS } from "@modules/utils/animations";
import React, { useContext, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { Button, Searchbar, Text, useTheme } from "react-native-paper";
import Animated, { Keyframe } from "react-native-reanimated";

import parseSearch from "./_utils";
import createStyles from "./index.styles";
import ResidentCard from "./Resident/ResidentCard";
import ResidentPage from "./Resident/ResidentPage";

// Spec §5.4: Each resident search result lifts in, staggered by FlatList index
const ResidentRowEntrance = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 8 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }] },
});

function FindResidents({
  selectPerson,
  setSelectPerson,
  organization,
  puenteForms,
  navigateToNewRecord,
  navigateToRecordHistory,
  surveyee,
  setSurveyee,
  setView,
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [query, setQuery] = useState("");
  const [residentsData, setResidentsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const { residentOfflineData } = useContext(OfflineContext);

  // Track the previous selectPerson to detect when the parent has refreshed it
  // after a SurveyData edit, so we can patch the list in-memory without a full re-fetch.
  const prevSelectPersonRef = useRef(null);

  useEffect(() => {
    if (
      selectPerson?.objectId &&
      prevSelectPersonRef.current !== selectPerson
    ) {
      prevSelectPersonRef.current = selectPerson;
      setResidentsData((prev) =>
        prev.map((r) =>
          r.objectId === selectPerson.objectId ? selectPerson : r
        )
      );
    }
  }, [selectPerson]);

  useEffect(() => {
    checkOnlineStatus().then(async (connected) => {
      if (connected) fetchData(true, "");
      if (!connected) fetchData(false, "");
    });
  }, [organization]);

  const fetchOfflineData = () => {
    setOnline(false);
    return residentOfflineData().then((residents) => {
      setResidentsData(residents);
      setLoading(false);
    });
  };

  const fetchOnlineData = async (qry) => {
    setOnline(true);

    const records = await parseSearch(organization, qry);

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
      }, MOTION_TOKENS.duration.pulse)
    );
  };

  const onSelectPerson = (listItem) => {
    setSelectPerson(listItem);
    setQuery("");
  };

  const renderItem = ({ item, index }) => (
    <Animated.View
      key={item.objectId}
      entering={ResidentRowEntrance
        .delay(Math.min(index * 40, 240))
        .duration(MOTION_TOKENS.duration.base)}
    >
      <ResidentCard resident={item} onSelectPerson={onSelectPerson} />
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {!selectPerson && (
        <View style={styles.container}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={styles.header}>
              {I18n.t("findResident.searchIndividual")}
            </Text>
          </View>
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

          <FlatList
            data={online ? residentsData : filterOfflineList(residentsData)}
            renderItem={renderItem}
            keyExtractor={(item) => item.objectId}
          />
        </View>
      )}

      {selectPerson && (
        <ResidentPage
          fname={selectPerson.fname}
          lname={selectPerson.lname}
          nickname={selectPerson.nickname}
          city={selectPerson.city}
          license={selectPerson.license}
          picture={selectPerson.picture}
          selectPerson={selectPerson}
          setSelectPerson={setSelectPerson}
          puenteForms={puenteForms}
          navigateToNewRecord={navigateToNewRecord}
          navigateToRecordHistory={navigateToRecordHistory}
          surveyee={surveyee}
          setSurveyee={setSurveyee}
          setView={setView || (() => {})}
        />
      )}
    </View>
  );
}

export default FindResidents;
