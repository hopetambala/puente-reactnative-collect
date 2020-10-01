import React from 'react';
import {
  View,
  StyleSheet
} from 'react-native';
import {
  Text, Button, Title, Paragraph, Card
} from 'react-native-paper';

import { layout, theme } from '../../../modules/theme';

import ComingSoonSVG from '../../../assets/graphics/static/Adventurer.svg'

const FormGallery = ({ setDataCollectionView }) => {
  return (
    <View>
      <View style={layout.screenRow}>
        <Text>Puente Forms</Text>
        <View style={layout.screenFlexRow}>
          <Card style={screenLayout.card}>
            <Text>Env Health</Text>
          </Card>
          <Card style={screenLayout.card}>
            <Text>Medical Assessment</Text>
          </Card>
          <Card style={screenLayout.card}>
            <Text>Vitals</Text>
          </Card>
        </View>
      </View>
      <View style={layout.screenRow}>
        <Text>Custom Forms</Text>
      </View>
      <View style={layout.screenRow}>
        <Text>Manage My Pinned Forms</Text>
      </View>
      <View style={layout.screenRow}>
        <Card>
          <Card.Content>
            <ComingSoonSVG width={200} height={200} />
            <Title>Our Marketplace</Title>
            <Paragraph>Discover forms created by trusted companies</Paragraph>
            <Button >
              <Text >Explore Forms</Text>
            </Button>
          </Card.Content>
        </Card>
      </View>
    </View>
  )
}

const screenLayout = StyleSheet.create({
  card: {
    height: 90,
    width: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  }

})

export default FormGallery