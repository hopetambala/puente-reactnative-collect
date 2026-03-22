import TermsModal from "@impacto-design-system/Extensions/TermsModal";
import I18n from "@modules/i18n";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Checkbox, Text, Title,useTheme  } from "react-native-paper";

function GdprCompliance({ setConsent }) {
  const theme = useTheme();
  const [visible, setVisible] = React.useState(false);
  const [checked, setChecked] = React.useState(false);

  // Create styles dynamically based on theme
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          borderRadius: 20,
          borderWidth: 1,
          padding: 0,
          margin: 15,
          flex: 3,
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "stretch",
          borderColor: theme.colors.primary,
        },
        policyButton: {
          flex: 1,
          borderTopWidth: 1,
          borderTopColor: theme.colors.primary,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        },
        checkbox: {
          borderWidth: 1,
          borderRadius: 5,
          marginLeft: 20,
          width: 40,
        },
        checkboxContainer: {
          flexDirection: "row",
        },
        checkboxText: {
          marginLeft: 15,
          marginTop: 10,
        },
      }),
    [theme.colors.primary]
  );

  const continueToForm = () => {
    if (checked) {
      setConsent(true);
    } else {
      alert(I18n.t("gdpr.mustConsent")); // eslint-disable-line
    }
  };
  return (
    <View>
      <Title style={{ marginLeft: 15 }}>{I18n.t("gdpr.consentForm")}</Title>
      <View style={styles.container}>
        <Text style={{ flex: 2, padding: 10 }}>{I18n.t("gdpr.policy")}</Text>
        <Button
          style={styles.policyButton}
          mode="outlined"
          onPress={() => setVisible(true)}
        >
          {I18n.t("gdpr.viewFullPolicy")}
        </Button>
      </View>
      <TermsModal visible={visible} setVisible={setVisible} />
      <View style={styles.checkboxContainer}>
        <View style={styles.checkbox}>
          <Checkbox
            disabled={false}
            // theme={theme}
            color={theme.colors.primary}
            status={checked ? "checked" : "unchecked"}
            onPress={() => {
              setChecked(!checked);
            }}
          />
        </View>
        <Text style={styles.checkboxText}>
          {I18n.t("gdpr.communityMemAgrees")}
        </Text>
      </View>

      <Button
        style={{ margin: 15 }}
        mode="contained"
        onPress={() => continueToForm()}
      >
        {I18n.t("gdpr.continueToForm")}
      </Button>
    </View>
  );
}

export default GdprCompliance;
