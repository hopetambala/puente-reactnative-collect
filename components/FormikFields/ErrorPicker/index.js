import React, { useState, useEffect } from 'react';
import { Snackbar } from 'react-native-paper';
import {
  View, Text
} from 'react-native';
import I18n from '../../../modules/i18n';

const ErrorPicker = ({ formikProps, inputs }) => {
  const { errors, isSubmitting } = formikProps;
  const [formErrors, setFormErrors] = useState([]);
  const [visible, setVisible] = useState(false);

  const keysToLabel = (keys) => {
    let label = [];
    keys.forEach((key) => {
      inputs.forEach((input) => {
        if (key === input.formikKey) {
          label = label.concat([I18n.t(input.label)]);
        } else if (input.fieldType === 'multiInputRowNum') {
          input.options.forEach((option) => {
            if (key === option.value) {
              label = label.concat(I18n.t(option.label));
            }
          });
        }
      });
    });
    setFormErrors(label.join(', '));
  };

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setVisible(true);
    } else {
      setVisible(false);
    }
    keysToLabel(Object.keys(errors));
  }, [isSubmitting]);

  const dismissSnackBar = () => setVisible(false);

  return (
    <View>
      <Snackbar
        visible={visible}
        onDismiss={dismissSnackBar}
        duration={8500}
        style={{
          backgroundColor: 'red',
          fontSize: 130
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
          Inavlid Fields:
          {'\n\n'}
          {formErrors}
        </Text>
      </Snackbar>
    </View>
  );
};

export default ErrorPicker;
