/**
 * Demographics - missing fields RED-GREEN TDD
 *
 * Bug: residents created offline (or with sparse records) have no dob / city /
 * community / province / license — each missing field renders the literal
 * text "undefined" on the resident page.
 * Fix: missing values render as blank, never the string "undefined".
 */
import { render, screen } from '@testing-library/react-native';
import React from 'react';

jest.mock('@modules/i18n', () => ({
  t: (key) => key,
}));

jest.mock('@modules/theme', () => ({
  spacing: { sm: 8, md: 16, lg: 24 },
  typography: { body1: { fontSize: 16 } },
}));

jest.mock('react-native-paper', () => {
  const ReactLib = require('react'); // eslint-disable-line global-require
  const { Text: RNText } = require('react-native'); // eslint-disable-line global-require

  return {
    Text: ({ children, style }) => ReactLib.createElement(RNText, { style }, children),
    useTheme: () => ({
      colors: { textSecondary: '#222' },
    }),
  };
});

// eslint-disable-next-line import/first
import Demographics from '..';

describe('Demographics - missing fields never render "undefined"', () => {
  test('a resident with no demographic data renders labels without "undefined"', () => {
    render(<Demographics selectPerson={{}} />);

    expect(screen.queryByText(/undefined/)).toBeNull();
    // Labels themselves still render.
    expect(
      screen.getByText(/findResident.residentPage.demographics.dob/)
    ).toBeDefined();
  });

  test('empty-string values (common in Parse data) also fall back to "—"', () => {
    render(<Demographics city="" dob="" community="" province="" license="" />);

    expect(
      screen.getByText(/findResident.residentPage.demographics.city —/)
    ).toBeDefined();
    expect(
      screen.getByText(/findResident.residentPage.demographics.dob —/)
    ).toBeDefined();
  });
});

/**
 * The row labelled "License Number" read `selectPerson.license`, and `license`
 * is not a field on SurveyData -- all 65 are in schema/schema.json and it is
 * not among them. So the row showed an em dash for every resident, while the
 * value sat in `cedulaNumber`, whose own en.json label IS "License Number".
 */
describe('Demographics - the national ID row', () => {
  it('shows the cedula number rather than an em dash', () => {
    const { getByText } = render(<Demographics cedulaNumber="402-1234567-8" />);

    expect(getByText(/402-1234567-8/)).toBeTruthy();
  });

  it('still falls back to an em dash when the resident has no cedula', () => {
    const { getByText } = render(<Demographics />);

    // This RTL version's getByText takes a string or RegExp, not a predicate.
    expect(getByText(/demographics\.license\s*—/)).toBeTruthy();
  });
});
