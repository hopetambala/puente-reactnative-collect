import StatDetailModal from '@app/domains/HomeScreen/components/StatDetailModal';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

const mockReset = jest.fn();

jest.mock('@app/domains/HomeScreen/hooks/useModalItems', () => jest.fn(() => ({
  items: [
    {
      objectId: 'survey-1',
      _parseClass: 'SurveyData',
      label: 'Initial household survey',
      createdAt: new Date('2026-06-01T12:00:00.000Z'),
    },
    {
      objectId: 'vitals-1',
      _parseClass: 'Vitals',
      label: 'BP check',
      createdAt: new Date('2026-06-01T13:00:00.000Z'),
    },
  ],
  isLoading: false,
  hasMore: false,
  loadMore: jest.fn(),
  reset: mockReset,
})));

jest.mock('@app/impacto-design-system/Base/Text', () => function MockText({ children, ...props }) {
  // eslint-disable-next-line global-require
  const { Text } = require('react-native');
  return <Text {...props}>{children}</Text>;
});

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => function MockIcon({ name }) {
  // eslint-disable-next-line global-require
  const { Text } = require('react-native');
  return <Text>{name}</Text>;
});

jest.mock('react-native-paper', () => ({
  useTheme: () => ({
    colors: {
      background: '#ffffff',
      onSurface: '#111111',
      onSurfaceVariant: '#444444',
      primary: '#007AFF',
    },
  }),
  Button: ({ children, onPress, disabled }) => {
    // eslint-disable-next-line global-require
    const ReactModule = require('react');
    // eslint-disable-next-line global-require
    const { Text } = require('react-native');
    return ReactModule.createElement(Text, { onPress: disabled ? undefined : onPress }, children);
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }),
}));

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line global-require
  const { View } = require('react-native');

  class MockKeyframe {
    delay() {
      return this;
    }

    duration() {
      return this;
    }
  }

  return {
    __esModule: true,
    default: {
      View,
    },
    Keyframe: MockKeyframe,
  };
});

describe('StatDetailModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls onSurveyDataPress with the pressed item when a SurveyData row is tapped', () => {
    const onSurveyDataPress = jest.fn();
    render(
      <StatDetailModal
        visible
        onClose={jest.fn()}
        title="Recent Activity"
        cardType="recentActivity"
        timeFilter="last7"
        onSurveyDataPress={onSurveyDataPress}
      />
    );

    fireEvent.press(screen.getByRole('button', { name: /initial household survey/i }));

    expect(onSurveyDataPress).toHaveBeenCalledTimes(1);
    expect(onSurveyDataPress).toHaveBeenCalledWith(
      expect.objectContaining({ objectId: 'survey-1', _parseClass: 'SurveyData' })
    );
  });

  it('only makes SurveyData rows tappable and only SurveyData rows show a tappable signifier', () => {
    render(
      <StatDetailModal
        visible
        onClose={jest.fn()}
        title="Recent Activity"
        cardType="recentActivity"
        timeFilter="last7"
      />
    );

    expect(screen.getByRole('button', { name: /initial household survey/i })).toBeTruthy();
    expect(screen.getByLabelText(/open collection history/i)).toBeTruthy();

    expect(screen.queryByRole('button', { name: /bp check/i })).toBeNull();
    fireEvent.press(screen.getByText('BP check'));
    expect(screen.queryByLabelText(/open collection history for bp check/i)).toBeNull();
  });

  it('displays a chevron-right icon next to "Open Collection History" to signal the row is tappable', () => {
    render(
      <StatDetailModal
        visible
        onClose={jest.fn()}
        title="Recent Activity"
        cardType="recentActivity"
        timeFilter="last7"
      />
    );

    // Assert that the chevron-right icon appears as a visual affordance for interactivity
    expect(screen.getByText('chevron-right')).toBeTruthy();
  });
});
