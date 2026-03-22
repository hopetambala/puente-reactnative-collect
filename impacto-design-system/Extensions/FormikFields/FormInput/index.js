import { spacing, typography } from "@modules/theme";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { StyleSheet, Text,View } from "react-native";
import { TextInput, useTheme } from "react-native-paper";

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      marginHorizontal: spacing.lg,
      marginVertical: spacing.md,
    },
    input: {
      backgroundColor: theme.colors.surfaceSunken,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: typography.caption.fontSize,
      marginTop: spacing.xs,
      marginLeft: spacing.sm,
    },
  });

function FormInput({ label, formikProps, formikKey, ...rest }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [isFocused, setIsFocused] = useState(false);
  const error = formikProps.touched[formikKey] && formikProps.errors[formikKey];

  const handleBlur = () => {
    setIsFocused(false);
    formikProps.setFieldTouched(formikKey, true);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <View style={styles.container}>
      <TextInput
        label={label}
        onChangeText={formikProps.handleChange(formikKey)}
        onBlur={handleBlur}
        onFocus={handleFocus}
        {...rest}
        mode="outlined"
        style={styles.input}
        theme={{
          colors: {
            placeholder: theme.colors.textTertiary,
            primary: isFocused ? theme.colors.primary : theme.colors.outline,
            error: theme.colors.error,
          },
        }}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

FormInput.propTypes = {
  label: PropTypes.string.isRequired,
  formikProps: PropTypes.shape({
    handleChange: PropTypes.func,
    setFieldTouched: PropTypes.func,
    errors: PropTypes.shape({}),
    touched: PropTypes.shape({}),
  }).isRequired,
  formikKey: PropTypes.string.isRequired,
};

export default FormInput;
