import { OfflineContext } from "@context/offline.context";
import { getData, storeData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import checkOnlineStatus from "@modules/offline";
import { getStaggerDelay } from "@modules/utils/animationRules";
import { MOTION_TOKENS } from "@modules/utils/animations";
import * as Haptics from "expo-haptics";
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
  setView,
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [query, setQuery] = useState("");
  const [residentsData, setResidentsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(true);
  const { residentOfflineData } = useContext(OfflineContext);

  // Track the previous selectPerson to detect when the parent has refreshed it
  // after a SurveyData edit, so we can patch the list in-memory without a full re-fetch.
  const prevSelectPersonRef = useRef(null);

  // Monotonic fetch sequence: a response only lands if no newer fetch has
  // started since — a slow, superseded search must never overwrite the list.
  const fetchSeqRef = useRef(0);

  // Debounce timer lives in a ref, not state — clearing must see the latest
  // timer even when keystrokes land inside a single render batch.
  const searchTimeoutRef = useRef(null);

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
    if (!organization) return;
    fetchData("");
  }, [organization]);

  const fetchOfflineData = (isCurrent = () => true) => {
    // Guard the flag too, not just the data — a superseded fetch must not
    // flip the offline banner.
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
      records = await parseSearch(organization, qry);
    } catch (e) {
      // Online search failed (expired session, flaky network, server error).
      // An unhandled rejection here left the surveyor staring at an empty
      // list — fall back to the offline resident cache instead.
      return fetchOfflineData(isCurrent);
    }

    // A successful full-list fetch (empty query) doubles as the offline
    // cache: surveyors get offline search without ever visiting
    // Settings → Offline Data. Filtered results never overwrite the cache —
    // that would shrink it to the last query's subset.
    if (!qry) {
      storeData(records, "residentData").catch(() => {});
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
    // Queued residents are filtered by a case-insensitive name prefix. This
    // is close to — not identical to — the online search: parseSearch only
    // queries fname/lname (nickname is checked here but not server-side),
    // and the offline list filter uses substring matching. Follow-up: add a
    // nickname subquery to parseSearch and align the offline filter.
    const q = (qry || "").toLowerCase();
    const matchesQuery = (resident) =>
      !q ||
      ["fname", "lname", "nickname"].some((field) =>
        String(resident?.[field] || "")
          .toLowerCase()
          .startsWith(q)
      );
    const allData = records.concat(offlineData.filter(matchesQuery));
    setResidentsData(allData.slice());
    setLoading(false);
    return undefined;
  };

  // Connectivity is resolved at fetch time — never trusted from a previous
  // render — so a surveyor who regains (or loses) signal mid-session gets the
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
    }, MOTION_TOKENS.duration.pulse);
  };

  const onSelectPerson = (listItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectPerson(listItem);
    setQuery("");
  };

  const renderItem = ({ item, index }) => (
    <Animated.View
      key={item.objectId}
      entering={ResidentRowEntrance
        .delay(index * getStaggerDelay(residentsData.length))
        .duration(MOTION_TOKENS.duration.base)}
    >
      <ResidentCard resident={item} onSelectPerson={onSelectPerson} />
    </Animated.View>
  );

  return (
    <View style={styles.screen}>
      {!selectPerson && (
        <View style={styles.container}>
          <View style={styles.headerContainer}>
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
            <>
              <Text style={styles.offlineNotice}>
                {I18n.t("findResident.offlineNotice")}
              </Text>
              <Button onPress={() => fetchData(query)}>
                {I18n.t("global.tryAgain")}
              </Button>
            </>
          )}
          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={styles.searchingText}>
                {I18n.t("findResident.searching")}
              </Text>
            </View>
          )}

          <FlatList
            data={online ? residentsData : filterOfflineList(residentsData)}
            renderItem={renderItem}
            keyExtractor={(item) => item.objectId}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>
                    {I18n.t("findResident.emptyState.title")}
                  </Text>
                  <Text style={styles.emptyBody}>
                    {I18n.t("findResident.emptyState.body")}
                  </Text>
                </View>
              ) : null
            }
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
          setView={setView || (() => {})}
        />
      )}
    </View>
  );
}

export default FindResidents;
