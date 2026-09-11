import { UserContext } from '@app/context/auth.context';
import SignIn from '@app/domains/Auth/SignIn';
import { render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@app/assets/graphics/static/Logo-Black.svg', () => 'PuenteLogo');
// Records the props the picker is handed, so a test can assert which language
// the screen believes it is in.
const capturedLanguagePickerProps = {};
jest.mock('@impacto-design-system/Extensions/LanguagePicker', () => (props) => {
  Object.assign(capturedLanguagePickerProps, props);
  return null;
});
jest.mock('@impacto-design-system/Extensions/TermsModal', () => () => null);
jest.mock('@modules/offline', () => jest.fn().mockResolvedValue(true));
jest.mock('@modules/i18n', () => ({ t: (key) => key, locale: 'en' }));

const mockUserContext = {
  onlineLogin: jest.fn(),
  offlineLogin: jest.fn(),
  isLoading: false,
  error: null,
};

const renderSignIn = () =>
  render(
    <UserContext.Provider value={mockUserContext}>
      <SignIn navigation={{ navigate: jest.fn(), setParams: jest.fn() }} route={{ params: {} }} />
    </UserContext.Provider>
  );

describe('SignIn automation hooks', () => {
  // The sign-in preamble is repeated in 9 Maestro flows and every one of them
  // typed into the username field by tapping the point "50%, 38%" — a hardcoded
  // fraction of a 393x852 screen, chosen because the floating label makes the
  // field ambiguous to a text selector. These IDs replace all 18 of those taps.
  it.each([
    ['username field', 'signin-username'],
    ['password field', 'signin-password'],
    ['submit button', 'signin-submit'],
    // Typing into an iOS SECURE text field crashes Maestro's XCUITest driver
    // ("Failed to connect to 127.0.0.1:<port>", driver restarts). The E2E
    // harness therefore cannot sign in from a cleared state at all -- which
    // visual-qa.yaml causes on every run, since it launches with
    // clearState: true. Toggling the field to plain text first avoids the
    // crash, so the toggle needs an ID the flows can address. Tapping it by
    // coordinate is what this whole set of IDs exists to stop: a drifted tap
    // lands on empty space and fails later somewhere unrelated.
    ['password visibility toggle', 'signin-password-visibility'],
  ])('exposes the %s as testID "%s"', (_label, testID) => {
    const { getByTestId } = renderSignIn();

    expect(getByTestId(testID)).toBeTruthy();
  });
});

/**
 * The language picker must show the language the app is ACTUALLY in.
 *
 * Collect chooses its language from the DEVICE at launch (modules/i18n reads
 * expo-localization once at module load). The picker on this screen kept its
 * own copy of that answer as `useState("en")` — a constant — so on a Spanish
 * phone the app rendered Spanish while the button above the form read
 * "Ingles".
 *
 * Seen for real on 2026-09-11, on a simulator set to es_DO: the whole sign-in
 * screen in Spanish, "Iniciar sesión", "Contraseña" — under a language button
 * claiming English. A surveyor who opens that picker is being told the app is
 * in a language it is not in.
 *
 * The i18n mock at the top of this file is a mutable object, so `locale` can be
 * changed between mounts without resetting the module registry — resetting it
 * re-registers React Native Testing Library's own hooks and fails with "Hooks
 * cannot be defined inside tests".
 */
describe('the language picker reflects the language the app is in', () => {
  // eslint-disable-next-line global-require
  const I18n = require('@modules/i18n');
  const original = I18n.locale;

  afterEach(() => { I18n.locale = original; });

  const languageShownByThePicker = (locale) => {
    I18n.locale = locale;
    capturedLanguagePickerProps.language = undefined;
    renderSignIn();
    return capturedLanguagePickerProps.language;
  };

  it.each([['es'], ['hk']])(
    'starts on %s when that is the device language, not on English',
    (locale) => {
      expect(languageShownByThePicker(locale)).toBe(locale);
    }
  );

  it('still starts on English on an English device', () => {
    expect(languageShownByThePicker('en')).toBe('en');
  });
});
