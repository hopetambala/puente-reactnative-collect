import ComingSoonSVG from "@app/assets/graphics/static/Adventurer.svg";
import { getTasksAsync } from "@modules/cached-resources";
import I18n from "@modules/i18n";
import { createLayoutStyles } from "@modules/theme";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Button, Card, Paragraph, Title,useTheme  } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

function HomeScreen() {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);
  const [tasks, setTasks] = useState(null);
  // const { navigation } = props;

  const showTasks = async () => {
    await getTasksAsync().then((result) => {
      setTasks(result);
    });
  };

  return (
    <SafeAreaView edges={["top"]} style={layout.screenContainer}>
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
    </SafeAreaView>
  );
}

export default HomeScreen;
