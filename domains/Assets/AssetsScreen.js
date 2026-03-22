import Assets from "@app/domains/DataCollection/Assets";
import ResearchSVG from "@assets/graphics/static/Research.svg";
import { UserContext } from "@context/auth.context";
import { getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import { createLayoutStyles } from "@modules/theme";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Card, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const createStyles = (colors) =>
  StyleSheet.create({
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
      color: colors.primary,
      fontWeight: "bold",
      marginHorizontal: 8,
    },
  });

function AssetsScreen({ navigation }) {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);
  const { colors } = useTheme();
  const styles = createStyles(colors);
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

  return (
    <SafeAreaView
      edges={["top"]}
      style={layout.screenContainer}
      onStartShouldSetResponderCapture={() => {
        setScrollViewScroll(true);
      }}
    >
      <KeyboardAvoidingView
        enabled
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={layout.screenContainer}
      >
        <ScrollView
          keyboardShouldPersistTaps="never"
          scrollEnabled={scrollViewScroll}
          style={layout.screenContainer}
        >
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text variant="headlineMedium" style={{ fontWeight: "bold", marginTop: 10 }}>
              {I18n.t("dataCollection.manageAssets")}
            </Text>
          </View>

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
    </SafeAreaView>
  );
}



export default AssetsScreen;
