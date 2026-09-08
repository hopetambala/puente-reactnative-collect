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

describe('PaperInputPicker - numberInput keyboard dismissal', () => {
  const numberData = {
    label: 'Number of individuals living in the house',
    formikKey: 'numberofIndividualsLivingintheHouse',
    fieldType: 'numberInput',
  };

  // keyboardType="numeric" gives an iOS keypad with NO return key, so there is
  // no key that dismisses it. The only dismiss affordance on the form is a
  // TouchableWithoutFeedback marked `accessible={false}` (domains/DataCollection/
  // Forms/index.js), which is deliberately hidden from VoiceOver. A VoiceOver
  // user therefore has no way to close the keyboard at all, and the submit
  // button sits behind it.
  it('offers a Done control for the numeric keypad', () => {
    const { getByTestId } = render(
      <PaperInputPicker
        data={numberData}
        formikProps={buildFormikProps({ numberofIndividualsLivingintheHouse: '4' })}
        customForm
      />
    );

    expect(
      getByTestId('numberInput-done-numberofIndividualsLivingintheHouse')
    ).toBeTruthy();
  });

  it('exposes that Done control to assistive technology', () => {
    const { getByTestId } = render(
      <PaperInputPicker
        data={numberData}
        formikProps={buildFormikProps({ numberofIndividualsLivingintheHouse: '4' })}
        customForm
      />
    );

    const done = getByTestId('numberInput-done-numberofIndividualsLivingintheHouse');
    expect(done.props.accessibilityLabel).toBeTruthy();
  });

  it('dismisses the keyboard when Done is pressed', () => {
    const { Keyboard } = require('react-native'); // eslint-disable-line global-require
    const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});

    const { getByTestId } = render(
      <PaperInputPicker
        data={numberData}
        formikProps={buildFormikProps({ numberofIndividualsLivingintheHouse: '4' })}
        customForm
      />
    );

    fireEvent.press(getByTestId('numberInput-done-numberofIndividualsLivingintheHouse'));

    expect(dismiss).toHaveBeenCalled();
    dismiss.mockRestore();
  });

  // The accessory is wired to the field by id; a field that does not name it
  // renders a Done button the keyboard never shows.
  it('links the field to the accessory view', () => {
    const { getByTestId } = render(
      <PaperInputPicker
        data={numberData}
        formikProps={buildFormikProps({ numberofIndividualsLivingintheHouse: '4' })}
        customForm
      />
    );

    const field = getByTestId('numberInput-numberofIndividualsLivingintheHouse');
    expect(field.props.inputAccessoryViewID).toBe(
      'numberInput-accessory-numberofIndividualsLivingintheHouse'
    );
  });
});
