// import * as React from 'react';
import SettingsView from "@app/domains/Settings";
import ComingSoonSVG from "@assets/graphics/static/Adventurer.svg";
import FindRecordSVG from "@assets/graphics/static/Find-Record-Icon.svg";
import ResearchSVG from "@assets/graphics/static/Research.svg";
import MedEvalSVG from "@assets/icons/Heart-Icon.svg";
import EnvSVG from "@assets/icons/Home-icon.svg";
import NewRecordSVG from "@assets/icons/New-Record-icon.svg";
import { AlertContext } from "@context/alert.context";
import { UserContext } from "@context/auth.context";
import { Toast } from "@impacto-design-system/Base";
import { FindResidents, Header } from "@impacto-design-system/Extensions";
import MapView from "@impacto-design-system/MapView";
import { getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import { layout } from "@modules/theme";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Button, Card } from "react-native-paper";

import Assets from "./Assets";
import FormGallery from "./FormGallery";
import Forms from "./Forms";
import EditRecords from "./EditRecords";
import styles from "./index.styles";

const puenteForms = [
  {
    tag: "id",
    name: "puenteForms.ResidentID",
    customForm: false,
    image: NewRecordSVG,
  },
  {
    tag: "env",
    name: "puenteForms.EnvironmentalHealth",
    customForm: false,
    image: EnvSVG,
  },
  {
    tag: "med-eval",
    name: "puenteForms.MedicalEvaluation",
    customForm: false,
    image: MedEvalSVG,
  },
  {
    tag: "vitals",
    name: "puenteForms.Vitals",
    customForm: false,
    image: NewRecordSVG,
  },
];

const DataCollection = ({ navigation }) => {
  const [scrollViewScroll, setScrollViewScroll] = useState();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(false);

  const [view, setView] = useState("Root");

  const [selectedForm, setSelectedForm] = useState("id");
  const [selectedAsset, setSelectedAsset] = useState(null);

  const [customForm, setCustomForm] = useState();
  const [pinnedForms, setPinnedForms] = useState([]);

  const [selectPerson, setSelectPerson] = useState();
  const [surveyee, setSurveyee] = useState({});

  const [surveyingOrganization, setSurveyingOrganization] = useState("");
  const [surveyingUser, setSurveyingUser] = useState();

  const { onLogout } = useContext(UserContext);
  const { visible, message, dismiss } = useContext(AlertContext);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        getData("currentUser").then((user) => {
          setSurveyingUser(`${user.firstname || ""} ${user.lastname || ""}`);
          setSurveyingOrganization(user.organization || surveyingOrganization);
        });
        getData("pinnedForms").then((forms) => {
          if (forms) setPinnedForms(forms);
        });
      };

      fetchData();
    }, [surveyingUser, surveyingOrganization])
  );

  const navigateToRoot = async () => {
    setView("Root");
  };

  const navigateToNewRecord = async (formTag, surveyeePerson) => {
    setView("Forms");
    setSurveyee(surveyeePerson || surveyee);
    setSelectedForm(formTag || "id");
  };

  const navigateToGallery = async () => {
    setView("Gallery");
  };

  const navigateToNewAssets = async () => {
    setView("Assets");
    setSelectedAsset({});
  };

  const navigateToViewAllAssets = async () => {
    setView("Assets");
    setSelectedAsset(null);
  };

  const navigateToCustomForm = async (form, surveyeePerson) => {
    setView("Forms");
    setSurveyee(surveyeePerson || surveyee);
    setSelectedForm("custom");
    setCustomForm(form || "");
  };

  const navigateToFindRecords = async () => {
    setView("Find Records");
  };

  const navigateToEditRecords = async () => {
    setView("Edit Records");
  };

  const logOut = () => onLogout().then(() => navigation.navigate("Sign In"));

  return (
    <View
      style={layout.screenContainer}
      onStartShouldSetResponderCapture={() => {
        setScrollViewScroll(true);
      }}
    >
      <Header view={view} setView={setView} setSettings={setSettings} />
      <KeyboardAvoidingView
        enabled
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {loading === true && <ActivityIndicator />}
        <ScrollView
          keyboardShouldPersistTaps="never"
          scrollEnabled={scrollViewScroll}
        >
          {settings === true ? (
            <SettingsView
              setView={setView}
              setSettings={setSettings}
              logOut={logOut}
              surveyingOrganization={surveyingOrganization}
              scrollViewScroll={scrollViewScroll}
              setScrollViewScroll={setScrollViewScroll}
            />
          ) : (
            <View>
              {view === "Root" && (
                <View>
                  <MapView organization={surveyingOrganization} />
                  <View style={styles.screenFlexRowWrap}>
                    <View style={styles.cardContainer}>
                      <Card
                        style={styles.cardSmallStyle}
                        onPress={() => navigateToNewRecord()}
                      >
                        <NewRecordSVG height={70} style={styles.svg} />
                        <Text style={styles.text}>
                          {I18n.t("dataCollection.newRecord")}
                        </Text>
                      </Card>
                    </View>
                    <View style={styles.cardContainer}>
                      <Card
                        style={styles.cardSmallStyle}
                        onPress={navigateToGallery}
                      >
                        <ComingSoonSVG
                          height={70}
                          width={70}
                          style={styles.svg}
                        />
                        <Text style={styles.text}>
                          {I18n.t("dataCollection.viewAll")}
                        </Text>
                      </Card>
                    </View>
                    <View style={styles.cardContainer}>
                      <Card
                        style={styles.cardSmallStyle}
                        onPress={navigateToEditRecords}
                      >
                        <ComingSoonSVG
                          height={70}
                          width={70}
                          style={styles.svg}
                        />
                        <Text style={styles.text}>
                          {/* {I18n.t("dataCollection.viewAll")} */}
                          Edit Record
                        </Text>
                      </Card>
                      <Card
                        style={styles.cardSmallStyle}
                        onPress={navigateToFindRecords}
                      >
                        <FindRecordSVG height={65} style={styles.svg} />
                        <Text style={styles.text}>
                          {I18n.t("dataCollection.findRecord")}
                        </Text>
                      </Card>
                    </View>

                    <View style={styles.cardContainer}>
                      <Card
                        style={styles.cardSmallStyle}
                        onPress={navigateToNewAssets}
                      >
                        <ResearchSVG
                          height={70}
                          width={70}
                          style={styles.svg}
                        />
                        <Text style={styles.text}>
                          {I18n.t("dataCollection.newAsset")}
                        </Text>
                      </Card>
                    </View>
                    <View style={styles.cardContainer}>
                      <Card
                        style={styles.cardSmallStyle}
                        onPress={navigateToViewAllAssets}
                      >
                        <ResearchSVG
                          height={70}
                          width={70}
                          style={styles.svg}
                        />
                        <Text style={styles.text}>
                          {I18n.t("dataCollection.viewAssets")}
                        </Text>
                      </Card>
                    </View>
                  </View>
                </View>
              )}
              {view === "Forms" && (
                <View>
                  <Button
                    icon="arrow-left"
                    width={100}
                    onPress={navigateToRoot}
                  >
                    <Text>{I18n.t("dataCollection.back")}</Text>
                  </Button>
                  <Forms
                    style={layout.line}
                    navigation={navigation}
                    scrollViewScroll={scrollViewScroll}
                    setScrollViewScroll={setScrollViewScroll}
                    navigateToGallery={navigateToGallery}
                    navigateToNewRecord={navigateToNewRecord}
                    navigateToRoot={navigateToRoot}
                    navigateToCustomForm={navigateToCustomForm}
                    selectedForm={selectedForm}
                    setSelectedForm={setSelectedForm}
                    surveyingUser={surveyingUser}
                    surveyingOrganization={surveyingOrganization}
                    surveyee={surveyee}
                    setSurveyee={setSurveyee}
                    customForm={customForm}
                    setView={setView}
                    pinnedForms={pinnedForms}
                  />
                </View>
              )}
              {view === "Assets" && (
                <View>
                  <Button
                    icon="arrow-left"
                    width={100}
                    onPress={navigateToRoot}
                  >
                    <Text>{I18n.t("dataCollection.back")}</Text>
                  </Button>
                  <Assets
                    surveyingOrganization={surveyingOrganization}
                    surveyingUser={surveyingUser}
                    selectedAsset={selectedAsset}
                    setSelectedAsset={setSelectedAsset}
                    navigateToNewAssets={navigateToNewAssets}
                    navigateToViewAllAssets={navigateToViewAllAssets}
                    scrollViewScroll={scrollViewScroll}
                    setScrollViewScroll={setScrollViewScroll}
                  />
                </View>
              )}
              {view === "Gallery" && (
                <View>
                  <Button
                    icon="arrow-left"
                    width={100}
                    onPress={navigateToRoot}
                  >
                    <Text>{I18n.t("dataCollection.back")}</Text>
                  </Button>
                  <FormGallery
                    navigation={navigation}
                    navigateToNewRecord={navigateToNewRecord}
                    puenteForms={puenteForms}
                    navigateToCustomForm={navigateToCustomForm}
                    setLoading={setLoading}
                    surveyingOrganization={surveyingOrganization}
                    pinnedForms={pinnedForms}
                    setPinnedForms={setPinnedForms}
                  />
                </View>
              )}
              {view === "Find Records" && (
                <View>
                  {!selectPerson && (
                    <Button
                      icon="arrow-left"
                      width={100}
                      onPress={navigateToRoot}
                    >
                      <Text>{I18n.t("dataCollection.back")}</Text>
                    </Button>
                  )}
                  <FindResidents
                    selectPerson={selectPerson}
                    setSelectPerson={setSelectPerson}
                    organization={surveyingOrganization}
                    puenteForms={puenteForms}
                    navigateToNewRecord={navigateToNewRecord}
                    surveyee={surveyee}
                    setSurveyee={setSurveyee}
                    navigateToRoot={navigateToRoot}
                    setView={setView}
                  />
                </View>
              )}
              {view === "Edit Records" && (
                <View>
                  {!selectPerson && (
                    <Button
                      icon="arrow-left"
                      width={100}
                      onPress={navigateToRoot}
                    >
                      <Text>{I18n.t("dataCollection.back")}</Text>
                    </Button>
                  )}
                  <EditRecords
                    navigateToRoot={navigateToRoot}
                    setView={setView}
                  />
                </View>
              )}
            </View>
          )}
        </ScrollView>
        <Toast
          text={message}
          visible={visible}
          onClick={dismiss}
          onClickLabel="Dismiss"
        />
      </KeyboardAvoidingView>
    </View>
  );
};

export default DataCollection;
