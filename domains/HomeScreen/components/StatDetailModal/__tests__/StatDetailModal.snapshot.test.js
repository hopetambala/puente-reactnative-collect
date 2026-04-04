import React from 'react';
import { render } from '@testing-library/react-native';
import StatDetailModal from '../index';

// Mock dependencies
jest.mock('react-native-paper', () => ({
  Button: ({ children, onPress, ...props }) => (
    <button onPress={onPress}>{children}</button>
  ),
}));

jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetModal: ({ children, ...props }) => <>{children}</>,
  useBottomSheetModalInternal: () => ({
    dismiss: jest.fn(),
  }),
}));

jest.mock('react-native-paper', () => ({
  useTheme: () => ({
    colors: {
      primary: '#007AFF',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      text: '#000000',
      subtitle: '#666666',
    },
    semanticTokens: {
      surface_neutral: '#F0F0F0',
      text_primary: '#000000',
      text_secondary: '#666666',
    },
  }),
}));

const mockItems = [
  { objectId: '1', label: 'John Doe', _parseClass: 'SurveyData', createdAt: new Date('2026-04-10') },
  { objectId: '2', label: 'Jane Smith', _parseClass: 'SurveyData', createdAt: new Date('2026-04-09') },
  { objectId: '3', label: 'Dr. Brown', _parseClass: 'Vitals', createdAt: new Date('2026-04-08') },
];

describe('StatDetailModal Component - Snapshots', () => {
  const mockModalRef = React.createRef();
  const mockLoadMore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders StatDetailModal with survey items', () => {
    const { toJSON } = render(
      <StatDetailModal
        ref={mockModalRef}
        cardType="mySurveys"
        title="My Surveys"
        items={mockItems.filter((i) => i._parseClass === 'SurveyData')}
        isLoading={false}
        hasMore={true}
        onLoadMore={mockLoadMore}
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });

  test('renders StatDetailModal in loading state', () => {
    const { toJSON } = render(
      <StatDetailModal
        ref={mockModalRef}
        cardType="mySurveys"
        title="My Surveys"
        items={[]}
        isLoading={true}
        hasMore={false}
        onLoadMore={mockLoadMore}
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });

  test('renders StatDetailModal with multiple item types', () => {
    const { toJSON } = render(
      <StatDetailModal
        ref={mockModalRef}
        cardType="recentActivity"
        title="Recent Activity"
        items={mockItems}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockLoadMore}
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });

  test('renders StatDetailModal with hasMore=true shows Load More button', () => {
    const { toJSON } = render(
      <StatDetailModal
        ref={mockModalRef}
        cardType="orgVitals"
        title="Organization Vitals"
        items={mockItems.filter((i) => i._parseClass === 'Vitals')}
        isLoading={false}
        hasMore={true}
        onLoadMore={mockLoadMore}
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });

  test('renders StatDetailModal with hasMore=false hides Load More button', () => {
    const { toJSON } = render(
      <StatDetailModal
        ref={mockModalRef}
        cardType="orgVitals"
        title="Organization Vitals"
        items={mockItems.filter((i) => i._parseClass === 'Vitals')}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockLoadMore}
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });

  test('renders StatDetailModal with empty items list', () => {
    const { toJSON } = render(
      <StatDetailModal
        ref={mockModalRef}
        cardType="mySurveys"
        title="My Surveys"
        items={[]}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockLoadMore}
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });

  test('renders StatDetailModal with many items', () => {
    const manyItems = Array.from({ length: 15 }, (_, i) => ({
      objectId: `${i}`,
      label: `Item ${i}`,
      _parseClass: 'SurveyData',
      createdAt: new Date(),
    }));

    const { toJSON } = render(
      <StatDetailModal
        ref={mockModalRef}
        cardType="mySurveys"
        title="My Surveys"
        items={manyItems}
        isLoading={false}
        hasMore={true}
        onLoadMore={mockLoadMore}
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });

  test('renders StatDetailModal with long item labels', () => {
    const longItems = [
      {
        objectId: '1',
        label: 'This is a very long label that might wrap to multiple lines in the UI component and we want to ensure it renders properly',
        _parseClass: 'SurveyData',
        createdAt: new Date(),
      },
      {
        objectId: '2',
        label: 'Another extremely long label with lots of text that should be handled gracefully by the component display',
        _parseClass: 'SurveyData',
        createdAt: new Date(),
      },
    ];

    const { toJSON } = render(
      <StatDetailModal
        ref={mockModalRef}
        cardType="mySurveys"
        title="My Surveys"
        items={longItems}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockLoadMore}
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });

  test('renders StatDetailModal with medical evaluation items', () => {
    const medicalItems = [
      {
        objectId: '1',
        label: 'Cardiovascular Assessment',
        _parseClass: 'EvaluationMedical',
        createdAt: new Date('2026-04-10'),
      },
      {
        objectId: '2',
        label: 'Respiratory Evaluation',
        _parseClass: 'EvaluationMedical',
        createdAt: new Date('2026-04-09'),
      },
    ];

    const { toJSON } = render(
      <StatDetailModal
        ref={mockModalRef}
        cardType="recentActivity"
        title="Recent Activity"
        items={medicalItems}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockLoadMore}
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });

  test('renders StatDetailModal with environmental health items', () => {
    const envItems = [
      {
        objectId: '1',
        label: 'Water Quality Assessment',
        _parseClass: 'HistoryEnvironmentalHealth',
        createdAt: new Date('2026-04-10'),
      },
      {
        objectId: '2',
        label: 'Air Quality Assessment',
        _parseClass: 'HistoryEnvironmentalHealth',
        createdAt: new Date('2026-04-09'),
      },
    ];

    const { toJSON } = render(
      <StatDetailModal
        ref={mockModalRef}
        cardType="recentActivity"
        title="Recent Activity"
        items={envItems}
        isLoading={false}
        hasMore={true}
        onLoadMore={mockLoadMore}
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });
});
