import AssetsNavigator from "@app/domains/Assets/navigator";
import DataCollectionNavigator from "@app/domains/DataCollection/navigator";
import FindRecordsNavigator from "@app/domains/FindRecords/navigator";
import { TabBarIcon } from "@impacto-design-system/Extensions";
import I18n from "@modules/i18n";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as React from "react";

const BottomTab = createBottomTabNavigator();
const INITIAL_ROUTE_NAME = "Data_Collection";
const tabIcon = (iconName) => ({ focused }) => (
  <TabBarIcon focused={focused} name={iconName} />
);

export default function BottomTabNavigator() {
  return (
    <BottomTab.Navigator initialRouteName={INITIAL_ROUTE_NAME}>
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
    </BottomTab.Navigator>
  );
}
