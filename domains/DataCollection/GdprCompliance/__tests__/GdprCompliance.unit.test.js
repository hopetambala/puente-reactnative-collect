import GdprCompliance from '@app/domains/DataCollection/GdprCompliance';
import I18n from '@modules/i18n';
import english from '@modules/i18n/english/en.json';
import spanish from '@modules/i18n/spanish/es.json';
import { fireEvent, render, userEvent } from '@testing-library/react-native';
import React from 'react';

jest.mock('@impacto-design-system/Extensions/TermsModal', () => () => null);
jest.mock('@modules/i18n', () => ({ t: (key) => key }));

describe('GdprCompliance automation hooks', () => {
  // Seven Maestro steps across the offline flows tapped "Continue to Form" at
  // the coordinate "50%, 79%" — a fraction of a 393x852 screen. A coordinate
  // tap cannot fail, so a shifted button is silent.
  it('exposes the continue button as testID "gdpr-continue-button"', () => {
    const { getByTestId } = render(<GdprCompliance setConsent={jest.fn()} />);

    expect(getByTestId('gdpr-continue-button')).toBeTruthy();
  });

  // Guards the hook that already exists but the flows were not using.
  it('keeps the consent row tappable by testID "gdpr-consent-row"', () => {
    const { getByTestId } = render(<GdprCompliance setConsent={jest.fn()} />);

    expect(getByTestId('gdpr-consent-row')).toBeTruthy();
  });

  // The consent gate. This is a health data collection app: a community member
  // has to agree before a surveyor can record anything about them, so Continue
  // must do nothing at all until the row is checked.
  it('does NOT give consent when Continue is pressed with the row unchecked', () => {
    const setConsent = jest.fn();
    const { getByTestId } = render(<GdprCompliance setConsent={setConsent} />);

    fireEvent.press(getByTestId('gdpr-continue-button'));

    expect(setConsent).not.toHaveBeenCalled();
  });

  it('gives consent once the row is checked and Continue is pressed', () => {
    const setConsent = jest.fn();
    const { getByTestId } = render(<GdprCompliance setConsent={setConsent} />);

    fireEvent.press(getByTestId('gdpr-consent-row'));
    fireEvent.press(getByTestId('gdpr-continue-button'));

    expect(setConsent).toHaveBeenCalledWith(true);
  });
});

describe('GdprCompliance accessible consent gate', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['English', english],
    ['Spanish', spanish],
  ])('offers one localized checkbox that controls consent in %s', async (_language, messages) => {
    jest.spyOn(I18n, 't').mockImplementation((key) => (
      key.split('.').reduce((value, part) => value[part], messages)
    ));
    const user = userEvent.setup();
    const setConsent = jest.fn();
    const { getAllByRole, getByRole, getByTestId } = render(
      <GdprCompliance setConsent={setConsent} />
    );

    await user.press(getByTestId('gdpr-continue-button'));
    expect(setConsent).not.toHaveBeenCalled();

    expect(getAllByRole('checkbox')).toHaveLength(1);
    const consentOptions = {
      name: messages.gdpr.communityMemAgrees,
      checked: false,
      disabled: false,
    };

    await user.press(getByRole('checkbox', consentOptions));
    expect(getAllByRole('checkbox')).toHaveLength(1);
    expect(getByRole('checkbox', { ...consentOptions, checked: true })).toBeTruthy();
    expect(setConsent).not.toHaveBeenCalled();

    await user.press(getByRole('checkbox', { ...consentOptions, checked: true }));
    expect(getByRole('checkbox', consentOptions)).toBeTruthy();
    await user.press(getByTestId('gdpr-continue-button'));
    expect(setConsent).not.toHaveBeenCalled();

    await user.press(getByRole('checkbox', consentOptions));
    await user.press(getByTestId('gdpr-continue-button'));
    expect(setConsent).toHaveBeenCalledTimes(1);
    expect(setConsent).toHaveBeenCalledWith(true);
  });
});
