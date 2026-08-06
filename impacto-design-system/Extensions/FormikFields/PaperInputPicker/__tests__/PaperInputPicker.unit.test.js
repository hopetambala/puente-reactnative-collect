/**
 * PaperInputPicker - Unit Tests
 *
 * Regression: the "selected" branch of a `select` field wires a
 * `TouchableWithoutFeedback OnPress={...}` (capital O) instead of `onPress`,
 * so React Native silently ignores it and re-pressing an already-selected
 * option never calls setFieldValue.
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

// jest.setup.js globally mocks this component with a plain TextInput stub
// (so other components' tests don't need to deal with its real complexity).
// This suite tests the real implementation, so it must opt back out.
jest.unmock('@impacto-design-system/Extensions/FormikFields/PaperInputPicker');
jest.mock('@modules/i18n', () => ({ t: (key) => key }));

// eslint-disable-next-line import/first
import PaperInputPicker from '@impacto-design-system/Extensions/FormikFields/PaperInputPicker';

const buildFormikProps = (values) => ({
  values,
  errors: {},
  handleChange: jest.fn(() => jest.fn()),
  handleBlur: jest.fn(() => jest.fn()),
  setFieldValue: jest.fn(),
});

describe('PaperInputPicker - select field', () => {
  it('calls setFieldValue when the already-selected option is pressed again', () => {
    const formikProps = buildFormikProps({ continueProgram: 'No' });
    const data = {
      label: 'Do you want to continue in the program?',
      formikKey: 'continueProgram',
      fieldType: 'select',
      options: [
        { value: 'Yes', label: 'Yes', text: false },
        { value: 'No', label: 'No', text: false },
      ],
    };

    const { getByTestId } = render(
      <PaperInputPicker data={data} formikProps={formikProps} customForm />
    );

    fireEvent.press(getByTestId('select-option-continueProgram-No'));

    expect(formikProps.setFieldValue).toHaveBeenCalledWith('continueProgram', 'No');
  });
});
