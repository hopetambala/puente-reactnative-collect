import Assets from "@app/domains/DataCollection/Assets";
import ResearchSVG from "@assets/graphics/static/Research.svg";
import ModernCard from "@impacto-design-system/Cards/ModernCard";
import { UserContext } from "@context/auth.context";
import { getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import { createLayoutStyles, spacing, typography } from "@modules/theme";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const createStyles = (theme) =>
  StyleSheet.create({
    cardContainer: {
      marginHorizontal: spacing.sm,
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
    },
    svg: {
      alignSelf: "center",
    },
    backContainer: {
      marginHorizontal: spacing.sm,
      marginVertical: spacing.sm,
    },
    text: {
      ...typography.label1,
      marginTop: spacing.sm,
      textAlign: "center",
      color: theme.colors.onSurface,
      fontWeight: "600",
    },
  });

function AssetsScreen({ navigation }) {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);
  const styles = createStyles(theme);
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
          <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
            <Text style={{ ...typography.heading2, fontWeight: "bold", color: theme.colors.onSurface, marginTop: spacing.sm }}>
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
            <ModernCard onPress={() => setSelectedAsset({})}>
              <ResearchSVG height={70} width={70} style={styles.svg} />
              <Text style={styles.text}>{I18n.t("dataCollection.newAsset")}</Text>
            </ModernCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}



export default AssetsScreen;
