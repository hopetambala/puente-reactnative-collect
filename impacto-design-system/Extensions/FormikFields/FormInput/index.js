import FieldStateIndicator from "@impacto-design-system/Extensions/FormikFields/FieldStateIndicator";
import { spacing, typography } from "@modules/theme";
import { ANIMATION_CONFIG, useShakeAnimation } from "@modules/utils/animations";
import PropTypes from "prop-types";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import Animated from "react-native-reanimated";

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      marginHorizontal: spacing.lg,
      marginVertical: spacing.md,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    inputContainer: {
      flex: 1,
    },
    input: {
      backgroundColor: theme.colors.surfaceSunken,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: typography.caption.fontSize,
      marginTop: spacing.xs,
      marginLeft: spacing.sm,
      fontWeight: "500",
    },
    successIndicator: {
      marginRight: spacing.xs,
    },
  });

/**
 * Modern form input component with enhanced styling and state indicators
 * Uses dlite semantic tokens for flat, minimal design
 * Includes error shake animation and state indicators
 */
function FormInput({
  label,
  formikProps,
  formikKey,
  isLoading = false,
  showSuccessOn = false,
  ...rest
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const error = formikProps.touched[formikKey] && formikProps.errors[formikKey];
  const value = formikProps.values[formikKey];
  const hasValue = value && value.toString().trim().length > 0;
  const showSuccess = showSuccessOn && hasValue && !error && !isLoading;

  // Shake animation on error
  const { shakeStyle, triggerShake } = useShakeAnimation({
    amplitude: ANIMATION_CONFIG.SHAKE_SMALL,
    axis: "translateX",
    duration: ANIMATION_CONFIG.DURATION_FAST,
  });

  useEffect(() => {
    if (error) {
      triggerShake();
    }
  }, [error, triggerShake]);

  const handleBlur = () => {
    // Mark field as touched but do NOT trigger validation on blur.
    // Validation only runs on submit to prevent premature shake/error animations.
    formikProps.setFieldTouched(formikKey, true, false);
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.inputWrapper,
          shakeStyle,
        ]}
      >
        <View style={styles.inputContainer}>
          <TextInput
            label={label}
            onChangeText={formikProps.handleChange(formikKey)}
            onBlur={handleBlur}
            value={value || ""}
            {...rest}
            mode="outlined"
            style={styles.input}
            error={!!error}
            theme={{
              colors: {
                placeholder: theme.colors.textTertiary,
                primary: theme.colors.primary,
                error: theme.colors.error,
              },
            }}
            editable={!isLoading}
          />
        </View>

        {/* State indicator: loading, success, or error */}
        <View style={styles.successIndicator}>
          {isLoading && <FieldStateIndicator state="loading" size={20} />}
          {showSuccess && <FieldStateIndicator state="success" size={20} />}
          {error && <FieldStateIndicator state="error" size={20} />}
        </View>
      </Animated.View>

      {/* Error message below input */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

FormInput.propTypes = {
  label: PropTypes.string.isRequired,
  formikProps: PropTypes.shape({
    handleChange: PropTypes.func,
    setFieldTouched: PropTypes.func,
    setFieldValue: PropTypes.func,
    errors: PropTypes.shape({}),
    touched: PropTypes.shape({}),
    values: PropTypes.shape({}),
  }).isRequired,
  formikKey: PropTypes.string.isRequired,
  isLoading: PropTypes.bool,
  showSuccessOn: PropTypes.bool,
};

FormInput.defaultProps = {
  isLoading: false,
  showSuccessOn: false,
};

export default FormInput;

