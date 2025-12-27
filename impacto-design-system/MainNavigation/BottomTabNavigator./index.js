// import DataAnalysis from '../../../domains/DataAnalysis';
// import HomeScreen from '../../../domains/HomeScreen';
import DataCollection from "@app/domains/DataCollection";
import { TabBarIcon } from "@impacto-design-system/Extensions";
import I18n from "@modules/i18n";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as React from "react";

const BottomTab = createBottomTabNavigator();
const INITIAL_ROUTE_NAME = "Data_Collection";

export default function BottomTabNavigator() {
  return (
    <BottomTab.Navigator initialRouteName={INITIAL_ROUTE_NAME}>
      {/* <BottomTab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Get Started',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} name="home" />,
        }}
      /> */}
      <BottomTab.Screen
        name="Data_Collection"
        component={DataCollection}
        options={{
          title: I18n.t("bottomTab.dataCollection"),
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} name="folder" />
          ),
        }}
      />
      {/* <BottomTab.Screen
        name="Data_Analysis"
        component={DataAnalysis}
        options={{
          title: 'Data Analysis',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} name="analytics" />,
        }}
      /> */}
    </BottomTab.Navigator>
  );
}
