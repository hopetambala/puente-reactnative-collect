import Assets from "@app/domains/DataCollection/Assets";
import ResearchSVG from "@assets/graphics/static/Research.svg";
import { UserContext } from "@context/auth.context";
import { Header } from "@impacto-design-system/Extensions";
import { getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import { layout, theme } from "@modules/theme";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button,Card } from "react-native-paper";

function AssetsScreen({ navigation }) {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [scrollViewScroll, setScrollViewScroll] = useState();
  const [surveyingOrganization, setSurveyingOrganization] = useState("");

  const { user } = useContext(UserContext);

  useFocusEffect(
    useCallback(() => {
      getData("currentUser").then((currentUser) => {
        if (!currentUser) return;
        setSurveyingOrganization(currentUser.organization || "");
      });
    }, [user])
  );

  const openSettings = () => navigation.navigate("Settings");

  return (
    <View
      style={layout.screenContainer}
      onStartShouldSetResponderCapture={() => {
        setScrollViewScroll(true);
      }}
    >
      <Header onOpenSettings={openSettings} />
      <KeyboardAvoidingView
        enabled
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="never"
          scrollEnabled={scrollViewScroll}
        >
          {selectedAsset && (
            <View style={styles.backContainer}>
              <Button icon="arrow-left" onPress={() => setSelectedAsset(null)}>
                <Text>{I18n.t("dataCollection.back")}</Text>
              </Button>
            </View>
          )}

          <Assets
            surveyingOrganization={surveyingOrganization}
            selectedAsset={selectedAsset}
            setSelectedAsset={setSelectedAsset}
            scrollViewScroll={scrollViewScroll}
            setScrollViewScroll={setScrollViewScroll}
          />
          <View style={styles.cardContainer}>
            <Pressable
              style={styles.cardPressable}
              onPress={() => setSelectedAsset({})}
              hitSlop={8}
            >
              <Card style={styles.cardSmallStyle}>
                <ResearchSVG height={70} width={70} style={styles.svg} />
                <Text style={styles.text}>{I18n.t("dataCollection.newAsset")}</Text>
              </Card>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    marginBottom: 20,
    marginHorizontal: 8,
  },
  cardPressable: {
    width: "95%",
  },
  cardSmallStyle: {
    width: "100%",
    minHeight: 150,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
  },
  svg: {
    alignSelf: "center",
  },
  backContainer: {
    marginHorizontal: 8,
    marginVertical: 8,
  },
  text: {
    marginTop: 10,
    textAlign: "center",
    color: theme.colors.primary,
    fontWeight: "bold",
    marginHorizontal: 8,
  },
});

export default AssetsScreen;
