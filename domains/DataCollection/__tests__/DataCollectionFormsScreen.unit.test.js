/**
 * DataCollectionFormsScreen - Unit Tests
 * RED phase: keyboard prop on root ScrollView
 */

import DataCollectionFormsScreen from '@app/domains/DataCollection/screens/DataCollectionFormsScreen';
import { UserContext } from '@context/auth.context';
import { render } from '@testing-library/react-native';
import React from 'react';
import { ScrollView } from 'react-native';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: jest.fn(),
}));

jest.mock('@context/auth.context', () => ({
  // eslint-disable-next-line global-require
  UserContext: require('react').createContext({ user: { objectId: 'u1', organization: 'org' } }),
}));

jest.mock('@modules/async-storage', () => ({
  getData: jest.fn().mockResolvedValue(null),
}));

jest.mock('@modules/offline', () => jest.fn().mockResolvedValue(true));

jest.mock('@modules/i18n', () => ({ t: (key) => key }));

jest.mock('@modules/theme', () => ({
  createLayoutStyles: () => ({ screenContainer: {} }),
}));

jest.mock('@app/domains/DataCollection/Forms', () => () => null);

const mockRoute = { params: { formTag: 'id', surveyee: {} } };
const mockNavigation = { navigate: jest.fn() };

describe('DataCollectionFormsScreen', () => {
  describe('ScrollView keyboard behavior', () => {
    it('renders the root ScrollView with keyboardShouldPersistTaps="handled"', () => {
      // eslint-disable-next-line camelcase
      const { UNSAFE_getAllByType } = render(
        <UserContext.Provider value={{ user: { objectId: 'u1', organization: 'org' } }}>
          <DataCollectionFormsScreen navigation={mockNavigation} route={mockRoute} />
        </UserContext.Provider>
      );

      const scrollViews = UNSAFE_getAllByType(ScrollView);
      expect(scrollViews.length).toBeGreaterThan(0);

      const rootScrollView = scrollViews[0];
      expect(rootScrollView.props.keyboardShouldPersistTaps).toBe('handled');
    });
  });
});
