import FieldStateIndicator from "@impacto-design-system/Extensions/FormikFields/FieldStateIndicator";
import { spacing, typography } from "@modules/theme";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { TextInput, useTheme } from "react-native-paper";

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
      // Modern flat design: Use border, not shadow
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 8, // Using dlite semantic border radius token value
    },
    errorText: {
      color: theme.colors.error,
      fontSize: typography.caption.fontSize,
      marginTop: spacing.xs,
      marginLeft: spacing.sm,
      fontWeight: "500",
    },
    labelContainer: {
      marginBottom: spacing.xs,
    },
    label: {
      ...typography.label1,
      color: theme.colors.onSurface,
      fontWeight: "600",
    },
    successIndicator: {
      marginRight: spacing.xs,
    },
  });

/**
 * Modern form input component with enhanced styling and state indicators
 * Uses dlite semantic tokens for flat, minimal design (no shadows)
 * Includes loading, success, and error state indicators
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
  const [isFocused, setIsFocused] = useState(false);
  const error = formikProps.touched[formikKey] && formikProps.errors[formikKey];
  const value = formikProps.values[formikKey];
  const hasValue = value && value.toString().trim().length > 0;
  const showSuccess = showSuccessOn && hasValue && !error && !isLoading;

  const handleBlur = () => {
    setIsFocused(false);
    formikProps.setFieldTouched(formikKey, true);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  // Determine border color based on state
  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (isFocused) return theme.colors.primary;
    return theme.colors.outline;
  };

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <TextInput
            onChangeText={formikProps.handleChange(formikKey)}
            onBlur={handleBlur}
            onFocus={handleFocus}
            value={value || ""}
            {...rest}
            mode="outlined"
            style={[styles.input, { borderColor: getBorderColor() }]}
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
          {isLoading && (
            <FieldStateIndicator state="loading" size={20} />
          )}
          {showSuccess && (
            <FieldStateIndicator state="success" size={20} />
          )}
          {error && (
            <FieldStateIndicator state="error" size={20} />
          )}
        </View>
      </View>

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

export default FormInput;

