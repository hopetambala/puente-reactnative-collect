import ComingSoonSVG from "@app/assets/graphics/static/Adventurer.svg";
import ModernCard from "@impacto-design-system/Cards/ModernCard";
import I18n from "@modules/i18n";
import { createLayoutStyles, spacing, typography } from "@modules/theme";
import React from "react";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

function HomeScreen() {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);

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
