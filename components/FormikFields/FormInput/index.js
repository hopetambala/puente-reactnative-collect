/* eslint-disable */
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { TextInput } from 'react-native-paper'
import { theme } from '../../../modules/theme';
import styles from '../PaperInputPicker/index.style';
export default function FormInput({
  label, formikProps, formikKey, ...rest
}) {
  return (
    <View style={{ marginHorizontal: 15, marginVertical: 0 }}>
      <TextInput
        label={label}
        onChangeText={formikProps.handleChange(formikKey)}
        onBlur={formikProps.handleBlur(formikKey)}
        {...rest}
        mode="outlined"
        theme={{ colors: { placeholder: theme.colors.primary }, text: 'black' }}
      />
      <Text style={{ color: 'red' }}>
        {formikProps.touched[formikKey] && formikProps.errors[formikKey]}
      </Text>
    </View>
  );
}
