import AssetsNavigator from "@app/domains/Assets/navigator";
import DataCollectionNavigator from "@app/domains/DataCollection/navigator";
import FindRecordsNavigator from "@app/domains/FindRecords/navigator";
import SettingsView from "@app/domains/Settings";
import { TabBarIcon } from "@impacto-design-system/Extensions";
import AnimatedTabBar from "@impacto-design-system/MainNavigation/BottomTabNavigator/AnimatedTabBar";
import I18n from "@modules/i18n";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useMemo } from "react";
import { useTheme } from "react-native-paper";

const BottomTab = createBottomTabNavigator();
const INITIAL_ROUTE_NAME = "Data_Collection";
const tabIcon = (iconName) => ({ focused }) => (
  <TabBarIcon focused={focused} name={iconName} />
);

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

  return (
    <BottomTab.Navigator
      initialRouteName={INITIAL_ROUTE_NAME}
      screenOptions={screenOptions}
      tabBar={(props) => <AnimatedTabBar {...props} />}
    >
      <BottomTab.Screen
        name="Find_Records"
        component={FindRecordsNavigator}
        options={{
          title: I18n.t("dataCollection.findRecord"),
          headerShown: false,
          tabBarIcon: tabIcon("search-outline"),
        }}
      />
      <BottomTab.Screen
        name="Data_Collection"
        component={DataCollectionNavigator}
        options={{
          title: I18n.t("bottomTab.dataCollection"),
          headerShown: false,
          tabBarIcon: tabIcon("folder-outline"),
        }}
      />
      <BottomTab.Screen
        name="Assets"
        component={AssetsNavigator}
        options={{
          title: I18n.t("dataCollection.viewAssets"),
          headerShown: false,
          tabBarIcon: tabIcon("map-outline"),
        }}
      />
      <BottomTab.Screen
        name="Settings"
        component={SettingsView}
        options={{
          title: I18n.t("global.settings"),
          headerShown: false,
          tabBarIcon: tabIcon("cog-outline"),
        }}
      />
    </BottomTab.Navigator>
  );
}
