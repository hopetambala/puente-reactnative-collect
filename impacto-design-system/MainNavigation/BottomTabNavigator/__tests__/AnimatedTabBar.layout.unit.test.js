import DataCollectionFormsScreen from '@app/domains/DataCollection/screens/DataCollectionFormsScreen';
import { UserContext } from '@context/auth.context';
import AnimatedTabBar from '@impacto-design-system/MainNavigation/BottomTabNavigator/AnimatedTabBar';
import {
  BottomTabBarHeightCallbackContext,
  BottomTabBarHeightContext,
} from '@react-navigation/bottom-tabs';
import { fireEvent, render } from '@testing-library/react-native';
import React, { useState } from 'react';
import { Platform, View } from 'react-native';

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
  createLayoutStyles: () => ({ screenContainer: { flex: 1 } }),
}));

// A nested form consumes the public navigation height, just as any screen
// deciding how much space is usable above the bottom bar must be able to do.
// Keep the real screen's ScrollView and keyboard wrapper in the tree.
jest.mock('@app/domains/DataCollection/Forms', () => {
  // eslint-disable-next-line global-require
  const MockReact = require('react');
  // eslint-disable-next-line global-require
  const { Text } = require('react-native');
  // eslint-disable-next-line global-require
  const { useBottomTabBarHeight } = require('@react-navigation/bottom-tabs');
  return function FormLayoutConsumer() {
    const occupiedHeight = useBottomTabBarHeight();
    return MockReact.createElement(Text, { testID: 'form-bottom-occupied-height' }, occupiedHeight);
  };
});

const routes = [
  { key: 'collection-key', name: 'Data_Collection' },
  { key: 'home-key', name: 'Home' },
];
const navigation = {
  emit: jest.fn(() => ({ defaultPrevented: false })),
  navigate: jest.fn(),
};
const descriptors = {
  'collection-key': { options: { title: 'Data Collection', tabBarTestID: 'tab-data-collection' } },
  'home-key': { options: { title: 'Home', tabBarTestID: 'tab-home' } },
};

function NestedFormWithCustomBar() {
  // Model only React Navigation's documented height-provider boundary. This
  // harness does not synthesize view bounds or pretend Jest does hit testing.
  const [occupiedHeight, setOccupiedHeight] = useState(49);
  return (
    <View style={{ flex: 1 }}>
      <BottomTabBarHeightContext.Provider value={occupiedHeight}>
        <UserContext.Provider value={{ user: { objectId: 'u1', organization: 'org' } }}>
          <DataCollectionFormsScreen
            route={{ params: { formTag: 'id' } }}
            navigation={navigation}
          />
        </UserContext.Provider>
      </BottomTabBarHeightContext.Provider>
      <BottomTabBarHeightCallbackContext.Provider value={setOccupiedHeight}>
        <AnimatedTabBar
          state={{ index: 0, routes }}
          descriptors={descriptors}
          navigation={navigation}
        />
      </BottomTabBarHeightCallbackContext.Provider>
    </View>
  );
}

describe('custom bottom bar layout available to nested forms', () => {
  const originalPlatform = Platform.OS;

  afterEach(() => {
    Platform.OS = originalPlatform;
  });

  it.each([
    ['ios', [{ width: 390, height: 108 }, { width: 844, height: 87 }]],
    ['android', [{ width: 412, height: 82 }, { width: 915, height: 101 }]],
  ])('publishes the complete occupied height after every %s bar layout', (platform, layouts) => {
    Platform.OS = platform;
    const rendered = render(<NestedFormWithCustomBar />);

    layouts.forEach(({ width, height }) => {
      // These are native outer-container measurements, including its surface,
      // top spacing, bottom spacing and safe area. They deliberately differ
      // from both the stock navigation height and the visible pill height.
      // eslint-disable-next-line camelcase
      const customBar = rendered.UNSAFE_getByType(AnimatedTabBar);
      const occupiedContainer = customBar.findByType(View);
      fireEvent(occupiedContainer, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width, height } },
      });

      expect(rendered.getByTestId('form-bottom-occupied-height').props.children).toBe(height);
    });
  });
});
