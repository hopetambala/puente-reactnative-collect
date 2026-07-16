/**
 * ResidentPage - display correctness RED-GREEN TDD
 *
 * Bugs:
 * 1. The profile picture is captured in a mount-only effect ([] deps), so a
 *    resident selected without a picture — or refreshed after an edit — keeps
 *    showing the stale (or missing) photo.
 * 2. A resident without a nickname renders the literal text "undefined".
 */
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Image } from 'react-native';

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

jest.mock('@impacto-design-system/Cards/SmallCardsCarousel', () => {
  const ReactLib = require('react'); // eslint-disable-line global-require
  const { Text } = require('react-native'); // eslint-disable-line global-require

  return function MockSmallCardsCarousel() {
    return ReactLib.createElement(Text, { testID: 'forms-carousel' }, 'forms-carousel');
  };
});

// eslint-disable-next-line import/first
import ResidentPage from '..';

const baseProps = {
  fname: 'Jane',
  lname: 'Doe',
  city: 'Quito',
  selectPerson: {
    objectId: 'resident-42',
    dob: '1990-01-01',
    communityname: 'Centro',
    province: 'Pichincha',
    license: 'A1',
  },
  setSelectPerson: jest.fn(),
  puenteForms: [],
  navigateToNewRecord: jest.fn(),
  navigateToRecordHistory: jest.fn(),
  setSurveyee: jest.fn(),
  setView: jest.fn(),
};

describe('ResidentPage - display correctness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('profile photo follows the picture prop; no photo shows an initials placeholder', () => {
    const { rerender } = render(
      <ResidentPage {...baseProps} nickname="JD" picture={null} />
    );

    // No photo: an initials placeholder, never an empty broken-looking box.
    expect(screen.getByTestId('profile-placeholder')).toBeDefined();
    expect(screen.getByText('JD')).toBeDefined();

    rerender(
      <ResidentPage
        {...baseProps}
        nickname="JD"
        picture={{ url: 'https://example.com/jane.jpg' }}
      />
    );

    expect(screen.queryByTestId('profile-placeholder')).toBeNull();
    expect(screen.UNSAFE_getByType(Image).props.source).toEqual({
      uri: 'https://example.com/jane.jpg',
    });
  });

  test('a resident without a nickname never renders the text "undefined"', () => {
    render(<ResidentPage {...baseProps} nickname={undefined} picture={null} />);

    expect(screen.queryByText(/undefined/)).toBeNull();
  });
});
