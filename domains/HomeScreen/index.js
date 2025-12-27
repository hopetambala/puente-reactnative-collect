import ComingSoonSVG from "@app/assets/graphics/static/Adventurer.svg";
import Header from "@impacto-design-system/Extensions/Header";
import { getTasksAsync } from "@modules/cached-resources";
import I18n from "@modules/i18n";
import { layout } from "@modules/theme";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Button, Card, Paragraph, Title } from "react-native-paper";

function HomeScreen() {
  const [tasks, setTasks] = useState(null);
  // const { navigation } = props;

  const showTasks = async () => {
    await getTasksAsync().then((result) => {
      setTasks(result);
    });
  };

  return (
    <View style={layout.screenContainer}>
      <Header />
      <ScrollView>
        <View style={layout.screenRow}>
          <Title>{I18n.t("home.myTasks")}</Title>
          <Card>
            <Card.Content>
              <ComingSoonSVG width={200} height={200} />
              <Paragraph>{I18n.t("home.comingSoon")}</Paragraph>
              <Button onPress={showTasks} mode="contained">
                <Text>{I18n.t("home.tasks")}</Text>
              </Button>
              {tasks != null &&
                tasks.map((task) => (
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
      </ScrollView>
    </View>
  );
}

export default HomeScreen;
