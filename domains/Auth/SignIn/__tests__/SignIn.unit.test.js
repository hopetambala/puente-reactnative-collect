import { UserContext } from '@app/context/auth.context';
import SignIn from '@app/domains/Auth/SignIn';
import { render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@app/assets/graphics/static/Logo-Black.svg', () => 'PuenteLogo');
jest.mock('@impacto-design-system/Extensions/LanguagePicker', () => () => null);
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
  ])('exposes the %s as testID "%s"', (_label, testID) => {
    const { getByTestId } = renderSignIn();

    expect(getByTestId(testID)).toBeTruthy();
  });
});
