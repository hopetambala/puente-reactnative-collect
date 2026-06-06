import { render, screen } from '@testing-library/react-native';
import React from 'react';

jest.mock('@modules/i18n', () => ({
  t: (key) => key,
}));

jest.mock('@modules/theme', () => ({
  spacing: { sm: 8, md: 16 },
  typography: { body1: { fontSize: 16 }, label1: { fontSize: 14 } },
}));

jest.mock('@modules/utils/animations', () => ({
  MOTION_TOKENS: { duration: { slow: 1, base: 1 } },
}));

jest.mock('react-native-reanimated', () => {
  const ReactLib = require('react'); // eslint-disable-line global-require
  const { View } = require('react-native'); // eslint-disable-line global-require

  class Keyframe {
    duration() {
      return this;
    }

    delay() {
      return this;
    }
  }

  const AnimatedView = ({ children, ...props }) => ReactLib.createElement(View, props, children);
  const Animated = { View: AnimatedView };

  return {
    __esModule: true,
    default: Animated,
    Keyframe,
  };
});

jest.mock('react-native-paper', () => {
  const ReactLib = require('react'); // eslint-disable-line global-require
  const { Text: RNText, TouchableOpacity } = require('react-native'); // eslint-disable-line global-require

  return {
    Button: ({ children, onPress }) =>
      ReactLib.createElement(TouchableOpacity, { onPress }, ReactLib.createElement(RNText, null, children)),
    Text: ({ children }) => ReactLib.createElement(RNText, null, children),
    useTheme: () => ({
      colors: {
        background: '#fff',
        outline: '#ddd',
        textSecondary: '#222',
        onSurface: '#000',
      },
    }),
  };
});

jest.mock('../Demographics', () => {
  const ReactLib = require('react'); // eslint-disable-line global-require
  const { Text } = require('react-native'); // eslint-disable-line global-require

  return function MockDemographics() {
    return ReactLib.createElement(Text, null, 'demographics-content');
  };
});

jest.mock('../Forms', () => {
  const ReactLib = require('react'); // eslint-disable-line global-require
  const { Text } = require('react-native'); // eslint-disable-line global-require

  return function MockForms() {
    return ReactLib.createElement(Text, null, 'forms-content');
  };
});

jest.mock('../Housheold', () => {
  const ReactLib = require('react'); // eslint-disable-line global-require
  const { Text } = require('react-native'); // eslint-disable-line global-require

  return function MockHousehold() {
    return ReactLib.createElement(Text, null, 'household-content');
  };
});

// eslint-disable-next-line import/first
import ResidentPage from '..';

describe('ResidentPage tabs', () => {
  test('shows only Demographics tab label in the tab area', () => {
    render(
      <ResidentPage
        fname="Jane"
        lname="Doe"
        nickname="JD"
        city="Quito"
        picture={null}
        selectPerson={{ dob: '1990-01-01', communityname: 'Centro', province: 'Pichincha', license: 'A1' }}
        setSelectPerson={jest.fn()}
        puenteForms={[]}
        navigateToNewRecord={jest.fn()}
        navigateToRecordHistory={jest.fn()}
        setSurveyee={jest.fn()}
        setView={jest.fn()}
      />
    );

    expect(screen.getByText('findResident.residentPage.household.demographics')).toBeDefined();
    expect(screen.queryByText('findResident.residentPage.household.forms')).toBeNull();
    expect(screen.queryByText('findResident.residentPage.household.household')).toBeNull();
  });
});
