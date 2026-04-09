import { GlassView } from "@impacto-design-system/Base";
import I18n from "@modules/i18n";
import { spacing } from "@modules/theme";
import PropTypes from "prop-types";
import React from "react";
import { StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Button, Modal, Portal, Text } from "react-native-paper";

const createStyles = () =>
  StyleSheet.create({
    modal: {
      backgroundColor: "transparent",
      padding: 0,
      margin: spacing.xl,
      borderRadius: spacing.radiusLarge,
    },
    glassContainer: {
      padding: spacing.xl,
      borderRadius: spacing.radiusLarge,
      overflow: "hidden",
    },
    button: {
      marginTop: spacing.xl,
    },
  });

function TermsModal({ visible, setVisible }) {
  const styles = createStyles();

  return (
    <Portal>
      <Modal
        visible={visible}
        contentContainerStyle={styles.modal}
        dismissable={false}
      >
        <GlassView
          style={styles.glassContainer}
          glassEffectStyle="regular"
          tintColor="rgba(200, 200, 200, 0.2)"
        >
          <ScrollView>
            <Text variant="headlineMedium" style={{ marginBottom: spacing.md }}>
              {I18n.t("termsModal.termsService")}
            </Text>
            <Text style={{ marginBottom: spacing.lg }}>
              {I18n.t("termsModal.policy")}
            </Text>
            <Button
              mode="contained"
              style={styles.button}
              onPress={() => setVisible(false)}
            >
              {I18n.t("termsModal.ok")}
            </Button>
          </ScrollView>
        </GlassView>
      </Modal>
    </Portal>
  );
}

TermsModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  setVisible: PropTypes.func.isRequired,
};

export default TermsModal;
