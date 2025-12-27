import ComingSoonSVG from "@assets/graphics/static/Adventurer.svg";
import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

function Household() {
  return <View>
    <View marginLeft="auto" marginRight="auto">
      <ComingSoonSVG width={200} height={200} />
    </View>
    <View marginLeft="auto" marginRight="auto">
      <Text marginLeft="auto" marginRight="auto">
        Coming Soon
      </Text>
    </View>
  </View>
}

export default Household;
