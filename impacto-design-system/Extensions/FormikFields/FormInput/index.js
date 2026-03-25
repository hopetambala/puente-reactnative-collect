import FieldStateIndicator from "@impacto-design-system/Extensions/FormikFields/FieldStateIndicator";
import { spacing, typography } from "@modules/theme";
import { ANIMATION_TIMINGS,SPRING_CONFIG } from "@modules/utils/animations";
import PropTypes from "prop-types";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
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
 * Includes loading, success, and error state indicators with animations
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

  // Animation refs
  const labelScaleAnim = useRef(new Animated.Value(hasValue || isFocused ? 0.8 : 1)).current;
  const labelTranslateYAnim = useRef(new Animated.Value(hasValue || isFocused ? -12 : 0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Animate label float on focus or when value exists
  useEffect(() => {
    Animated.parallel([
      Animated.spring(labelScaleAnim, {
        toValue: hasValue || isFocused ? 0.8 : 1,
        tension: SPRING_CONFIG.PLAYFUL.tension,
        friction: SPRING_CONFIG.PLAYFUL.friction,
        useNativeDriver: true,
      }),
      Animated.spring(labelTranslateYAnim, {
        toValue: hasValue || isFocused ? -12 : 0,
        tension: SPRING_CONFIG.PLAYFUL.tension,
        friction: SPRING_CONFIG.PLAYFUL.friction,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused, hasValue, labelScaleAnim, labelTranslateYAnim]);

  // Animate glow on focus
  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: isFocused ? 1 : 0,
      duration: ANIMATION_TIMINGS.DURATION_GLOBAL,
      useNativeDriver: false,
    }).start();
  }, [isFocused, glowAnim]);

  // Shake animation on error
  useEffect(() => {
    if (error) {
      // Shake: -5, +5, -2, 0
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: -5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [error, shakeAnim]);

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

  // Glow shadow effect on focus
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  return (
    <View style={styles.container}>
      {label && (
        <Animated.View
          style={[
            styles.labelContainer,
            {
              transform: [
                { scale: labelScaleAnim },
                { translateY: labelTranslateYAnim },
              ],
            },
          ]}
        >
          <Text style={styles.label}>{label}</Text>
        </Animated.View>
      )}
      <Animated.View
        style={[
          styles.inputWrapper,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        <View style={styles.inputContainer}>
          <Animated.View
            style={[
              {
                position: "absolute",
                inset: -3,
                borderRadius: 8,
                backgroundColor: theme.colors.primary,
                opacity: glowOpacity,
                pointerEvents: "none",
              },
            ]}
          />
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

