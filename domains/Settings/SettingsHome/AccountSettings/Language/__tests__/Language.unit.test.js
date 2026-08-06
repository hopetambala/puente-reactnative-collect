/**
 * Language settings - Unit Tests
 *
 * AS-22 (RED): the selected language is signalled purely by Paper's button
 * `mode` (contained vs outlined) -- colour alone. There is no check icon and no
 * accessibilityState, so a screen-reader user cannot tell which language is
 * active, and neither can anyone reading the screen in bright sun.
 */

import Language from '@app/domains/Settings/SettingsHome/AccountSettings/Language';
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock('@modules/i18n', () => ({ t: (key) => key, locale: 'en' }));

jest.mock('@app/domains/Settings/index.styles', () => ({
  createSettingsStyles: () => ({ languageContainer: {}, text: {} }),
}));

jest.mock('@modules/async-storage', () => ({
  getData: jest.fn().mockResolvedValue('es'),
  storeData: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-paper', () => {
  // eslint-disable-next-line global-require
  const ReactLocal = require('react');
  // eslint-disable-next-line global-require
  const RN = require('react-native');
  return {
    Button: ({ children, onPress, testID, mode, icon, accessibilityState }) =>
      ReactLocal.createElement(
        RN.Text,
        { onPress, testID, mode, icon, accessibilityState },
        children
      ),
    Text: ({ children }) => ReactLocal.createElement(RN.Text, null, children),
    useTheme: () => ({ dark: false, colors: { primary: '#0a46b6' } }),
  };
});

describe('Language settings', () => {
  it('marks the active language as selected for assistive tech', async () => {
    const { getByTestId } = render(<Language />);

    await waitFor(() => {
      expect(getByTestId('language-es').props.accessibilityState).toEqual(
        expect.objectContaining({ selected: true })
      );
    });
  });

  it('does not mark the inactive languages as selected', async () => {
    const { getByTestId } = render(<Language />);

    await waitFor(() => {
      expect(getByTestId('language-es')).toBeTruthy();
    });

    expect(getByTestId('language-en').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: false })
    );
  });

  it('gives the active language a non-colour channel as well', async () => {
    const { getByTestId } = render(<Language />);

    await waitFor(() => {
      expect(getByTestId('language-es').props.icon).toBe('check');
    });
    expect(getByTestId('language-en').props.icon).toBeUndefined();
  });
});
