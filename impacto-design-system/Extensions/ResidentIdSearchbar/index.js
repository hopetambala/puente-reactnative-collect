import { OfflineContext } from "@context/offline.context";
import ResidentCard from "@impacto-design-system/Extensions/FindResidents/Resident/ResidentCard";
import { getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import checkOnlineStatus from "@modules/offline";
import { MOTION_TOKENS } from "@modules/utils/animations";
import React, { useContext, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import { Button, Searchbar, Text, useTheme } from "react-native-paper";
import Animated, { Keyframe } from "react-native-reanimated";

import parseSearch from "./utils";

// Spec §5.4: resident search rows lift in staggered
const ResidentRowEntrance = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 8 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }] },
});

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

  // Monotonic fetch sequence: a response only lands if no newer fetch has
  // started since. A slow superseded search must never overwrite the list with
  // results for a query the surveyor has already changed.
  const fetchSeqRef = useRef(0);

  // The debounce timer lives in a ref, not state — clearing must see the
  // latest timer even when keystrokes land inside a single render batch.
  const searchTimeoutRef = useRef(null);
  const { residentOfflineData } = useContext(OfflineContext);

  useEffect(() => {
    fetchData("");
  }, [surveyingOrganization]);

  const fetchOfflineData = (isCurrent = () => true) => {
    // Guard the flag too, not just the data — a superseded fetch must not flip
    // the offline banner.
    if (!isCurrent()) return Promise.resolve();
    setOnline(false);

    return residentOfflineData().then((residents) => {
      if (!isCurrent()) return;
      setResidentsData(residents);
      setLoading(false);
    });
  };

  const fetchOnlineData = async (qry, isCurrent = () => true) => {
    if (!isCurrent()) return undefined;
    setOnline(true);

    let records;
    try {
      records = await parseSearch(surveyingOrganization, qry);
    } catch (e) {
      // Online search failed (expired session, flaky signal, server error). An
      // unhandled rejection here left the surveyor staring at an empty list —
      // and an empty list is how a resident who already exists gets entered a
      // second time. Fall back to the cached residents instead.
      //
      // Logged rather than swallowed silently: a fallback that never surfaces
      // means an expired session looks exactly like "this person is new".
      console.log("resident search failed, using cached residents:", String(e)); //eslint-disable-line
      return fetchOfflineData(isCurrent);
    }

    let offlineData = [];

    await getData("offlineIDForms").then((offlineResidentData) => {
      if (offlineResidentData !== null) {
        Object.entries(offlineResidentData).forEach(([, value]) => {
          //eslint-disable-line
          offlineData = offlineData.concat(value.localObject);
        });
      }
    });

    if (!isCurrent()) return undefined;
    const allData = records.concat(offlineData);
    setResidentsData(allData.slice());
    setLoading(false);
    return undefined;
  };

  // Connectivity is resolved at fetch time — never trusted from a previous
  // render — so a surveyor who loses (or regains) signal mid-session gets the
  // right search path on their very next keystroke.
  const fetchData = (qry) => {
    fetchSeqRef.current += 1;
    const fetchId = fetchSeqRef.current;
    const isCurrent = () => fetchId === fetchSeqRef.current;
    return checkOnlineStatus().then((connected) =>
      connected ? fetchOnlineData(qry, isCurrent) : fetchOfflineData(isCurrent)
    );
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

    clearTimeout(searchTimeoutRef.current);

    setQuery(input);

    searchTimeoutRef.current = setTimeout(() => {
      fetchData(input);
    }, 1000);
  };

  const onSelectSurveyee = (listItem) => {
    setSurveyee(listItem);
    setQuery("");
  };

  const renderItem = ({ item, index }) => (
    <Animated.View
      entering={ResidentRowEntrance
        .delay(Math.min(index * 40, 200))
        .duration(MOTION_TOKENS.duration.base)}
    >
      <Pressable
        testID={`resident-result-${index}`}
        onPress={() => onSelectSurveyee(item)}
        style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 16 }}
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
      </Pressable>
    </Animated.View>
  );

  return (
    <View>
      <Searchbar
        testID="resident-searchbar-input"
        placeholder={I18n.t("findResident.typeHere")}
        onChangeText={onChangeSearch}
        value={query}
      />
      {!online && (
        <Button onPress={() => fetchData("")}>
          {I18n.t("global.refresh")}
        </Button>
      )}
      {loading && <ActivityIndicator color={theme.colors.primary} />}

      {query !== "" && (
        <FlatList
          keyboardShouldPersistTaps="handled"
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
