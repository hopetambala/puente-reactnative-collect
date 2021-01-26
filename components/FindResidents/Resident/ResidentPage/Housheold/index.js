import React from 'react';
import {
  View
} from 'react-native';
import {
  Text
} from 'react-native-paper';

import ComingSoonSVG from '../../../../../assets/graphics/static/Adventurer.svg';

const Household = () => (
  <View>
    <View marginLeft="auto" marginRight="auto">
      <ComingSoonSVG width={200} height={200} />
    </View>
    <View marginLeft="auto" marginRight="auto">
      <Text marginLeft="auto" marginRight="auto">Coming Soon</Text>
    </View>
  </View>
);

export default Household;
