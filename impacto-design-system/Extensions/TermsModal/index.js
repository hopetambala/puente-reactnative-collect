import I18n from "@modules/i18n";
import { PRIVACY_POLICY_URL } from "@modules/legal";
import { spacing } from "@modules/theme";
import * as WebBrowser from "expo-web-browser";
import PropTypes from "prop-types";
import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Button, Modal, Portal, Text, useTheme } from "react-native-paper";

const createStyles = (theme) =>
  StyleSheet.create({
    modal: {
      backgroundColor: theme.colors.surfaceRaised || theme.colors.surface,
      padding: spacing.xl,
      margin: spacing.xl,
      borderRadius: spacing.radiusLarge,
      overflow: "hidden",
    },
    button: {
      marginTop: spacing.xl,
    },
  });

function TermsModal({ visible, setVisible }) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Portal>
      <Modal
        visible={visible}
        contentContainerStyle={styles.modal}
        dismissable={false}
      >
        <ScrollView>
          <Text variant="headlineMedium" style={{ marginBottom: spacing.md }}>
            {I18n.t("termsModal.termsService")}
          </Text>
          <Text style={{ marginBottom: spacing.lg }}>
            {I18n.t("gdpr.policy")}
          </Text>
          <Button
            mode="outlined"
            testID="privacy-policy-link"
            onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
          >
            {I18n.t("termsModal.viewCurrentPolicy")}
          </Button>
          <Button
            mode="contained"
            style={styles.button}
            onPress={() => setVisible(false)}
          >
            {I18n.t("termsModal.ok")}
          </Button>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

TermsModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  setVisible: PropTypes.func.isRequired,
};

export default TermsModal;
