import React, { useState } from 'react';
import {
  Text, View
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import {
  Button, Card, Paragraph, Title
} from 'react-native-paper';

import ComingSoonSVG from '../../assets/graphics/static/Adventurer.svg';
import Header from '../../components/Header';
import { deleteData } from '../../modules/async-storage';
import { getTasksAsync } from '../../modules/cached-resources';
import I18n from '../../modules/i18n';
import { layout } from '../../modules/theme';
import { retrieveSignOutFunction } from '../../services/parse/auth';

const HomeScreen = (props) => {
  const [tasks, setTasks] = useState(null);
  const { navigation } = props;

  const showTasks = async () => {
    await getTasksAsync().then((result) => {
      setTasks(result);
    });
  };

  const logOut = () => {
    retrieveSignOutFunction().then(() => {
      deleteData('credentials');
      deleteData('pincode');
      deleteData('organization');
      deleteData('currentUser');
      navigation.navigate('Sign In');
    });
  };

  return (
    <View style={layout.screenContainer}>
      <Header logOut={logOut} />
      <ScrollView>
        <View style={layout.screenRow}>
          <Title>{I18n.t('home.myTasks')}</Title>
          <Card>
            <Card.Content>
              <ComingSoonSVG width={200} height={200} />
              <Paragraph>{I18n.t('home.comingSoon')}</Paragraph>
              <Button onPress={showTasks} mode="contained">
                <Text>{I18n.t('home.tasks')}</Text>
              </Button>
              {tasks != null
                && tasks.map((task) => (
                  <View key={task.task_id}>
                    <Text>{task.name}</Text>
                  </View>
                ))}
            </Card.Content>
          </Card>
        </View>
        {/* <View style={layout.screenRow}>
          <Text>My Pinned Forms</Text>
        </View> */}
        {/* <View style={layout.screenRow}>
          <Title>My Community Board</Title>
          <Card>
            <Card.Content>
              <ComingSoonSVG width={200} height={200} />

              <Paragraph>Coming Soon</Paragraph>
            </Card.Content>
          </Card>
        </View> */}
        <Button onPress={logOut} mode="contained">
          <Text>{I18n.t('home.logOut')}</Text>
        </Button>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
