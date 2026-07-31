/**
 * PopupSuccess - Unit Tests
 *
 * AS-31 (RED): the success message is hardcoded English --
 * `{submittedForms} Records Successfully Stored!` -- so a Spanish- or
 * Kreyol-speaking promotor gets English on the cache-populate success path.
 *
 * The copy also blurred the offline-first distinction the project requires:
 * these records are stored ON THIS DEVICE, not on the server.
 */

import PopupSuccess from '@app/impacto-design-system/Base/PopupSuccess';
import { render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@modules/i18n', () => ({ t: (key) => key }));

jest.mock('@modules/theme', () => ({
  spacing: { md: 12, lg: 16, radiusMedium: 8 },
  typography: { label1: { fontSize: 14, fontWeight: '600' } },
}));

jest.mock('@modules/utils/animations', () => ({
  MOTION_TOKENS: { duration: { dismiss: 4000 } },
}));

jest.mock('@impacto-design-system/Base/GlassView', () => {
  // eslint-disable-next-line global-require
  const ReactLocal = require('react');
  return ({ children }) => ReactLocal.createElement(ReactLocal.Fragment, null, children);
});

jest.mock('react-native-paper', () => {
  // eslint-disable-next-line global-require
  const ReactLocal = require('react');
  return {
    Snackbar: ({ children, visible }) =>
      visible ? ReactLocal.createElement(ReactLocal.Fragment, null, children) : null,
    useTheme: () => ({ dark: false, colors: { primary: '#0a46b6', success: '#0f0' } }),
  };
});

describe('PopupSuccess', () => {
  it('renders a translated message rather than hardcoded English', () => {
    const { queryByText, getByText } = render(
      <PopupSuccess success setSuccess={jest.fn()} submittedForms={12} />
    );

    expect(queryByText(/Records Successfully Stored/)).toBeNull();
    expect(getByText('global.recordsStoredOnDevice')).toBeTruthy();
  });
});
