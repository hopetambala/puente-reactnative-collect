import AssetsNavigator from "@app/domains/Assets/navigator";
import DataCollectionNavigator from "@app/domains/DataCollection/navigator";
import FindRecordsNavigator from "@app/domains/FindRecords/navigator";
import HomeScreen from "@app/domains/HomeScreen";
import SettingsView from "@app/domains/Settings";
import { TabBarIcon } from "@impacto-design-system/Extensions";
import AnimatedTabBar from "@impacto-design-system/MainNavigation/BottomTabNavigator/AnimatedTabBar";
import I18n from "@modules/i18n";
import { ANIMATION_CONFIG, SPRING_CONFIG } from "@modules/utils/animations";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo } from "react";
import { useTheme } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const BottomTab = createBottomTabNavigator();
const INITIAL_ROUTE_NAME = "Home";
const tabIcon = (iconName) => ({ focused }) => (
  <TabBarIcon focused={focused} name={iconName} />
);

/**
 * Wrapper component that animates tab screen entrance with scale + spring
 */
function TabScreenWrapper({ children }) {
  const isFocused = useIsFocused();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isFocused) {
      scale.value = ANIMATION_CONFIG.SCALE_SUBTLE_ENTRANCE;
      scale.value = withSpring(1, SPRING_CONFIG.SMOOTH);
    }
  }, [isFocused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

export default function BottomTabNavigator() {
  const theme = useTheme();

  const screenOptions = useMemo(
    () => ({
      tabBarStyle: {
        backgroundColor: theme.colors.background,
        borderTopWidth: 0,
        elevation: 8,
        paddingTop: 8,
        paddingHorizontal: 80,
      },
      tabBarItemStyle: {
        paddingVertical: 8,
        paddingHorizontal: 4,
      },
      tabBarShowLabel: false,
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.textSecondary,
      headerStyle: {
        backgroundColor: theme.colors.background,
      },
      headerTintColor: theme.colors.textPrimary,
    }),
    [theme]
  );

  const renderTabBar = useCallback((props) => <AnimatedTabBar {...props} />, []);

  return (
    <BottomTab.Navigator
      initialRouteName={INITIAL_ROUTE_NAME}
      screenOptions={screenOptions}
      tabBar={renderTabBar}
    >
      <BottomTab.Screen
        name="Find_Records"
        options={{
          title: I18n.t("dataCollection.findRecord"),
          headerShown: false,
          tabBarIcon: tabIcon("search-outline"),
        }}
      >
        {(props) => (
          <TabScreenWrapper>
            <FindRecordsNavigator {...props} />
          </TabScreenWrapper>
        )}
      </BottomTab.Screen>
      <BottomTab.Screen
        name="Data_Collection"
        options={{
          title: I18n.t("bottomTab.dataCollection"),
          headerShown: false,
          tabBarIcon: tabIcon("folder-outline"),
        }}
      >
        {(props) => (
          <TabScreenWrapper>
            <DataCollectionNavigator {...props} />
          </TabScreenWrapper>
        )}
      </BottomTab.Screen>
      <BottomTab.Screen
        name="Home"
        options={{
          title: I18n.t("bottomTab.home"),
          headerShown: false,
          tabBarIcon: tabIcon("home-outline"),
        }}
      >
        {(props) => (
          <TabScreenWrapper>
            <HomeScreen {...props} />
          </TabScreenWrapper>
        )}
      </BottomTab.Screen>
      <BottomTab.Screen
        name="Assets"
        options={{
          title: I18n.t("dataCollection.viewAssets"),
          headerShown: false,
          tabBarIcon: tabIcon("map-outline"),
        }}
      >
        {(props) => (
          <TabScreenWrapper>
            <AssetsNavigator {...props} />
          </TabScreenWrapper>
        )}
      </BottomTab.Screen>
      <BottomTab.Screen
        name="Settings"
        options={{
          title: I18n.t("global.settings"),
          headerShown: false,
          tabBarIcon: tabIcon("cog-outline"),
        }}
      >
        {(props) => (
          <TabScreenWrapper>
            <SettingsView {...props} />
          </TabScreenWrapper>
        )}
      </BottomTab.Screen>
    </BottomTab.Navigator>
  );
}
