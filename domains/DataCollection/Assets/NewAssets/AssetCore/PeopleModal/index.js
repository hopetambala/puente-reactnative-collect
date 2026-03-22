import { Button as PaperButton } from "@impacto-design-system/Base";
import I18n from "@modules/i18n";
import React from "react";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { Appbar, TextInput, useTheme } from "react-native-paper";

function PeopleModal({
  people,
  handleInputChange,
  handleAddClick,
  handleRemoveClick,
  toggleModal,
  stylesPaper,
  stylesDefault,
}) {
  const theme = useTheme();
  return <>
    <Appbar.Header style={{ backgroundColor: theme.colors.surfaceRaised }}>
      <Appbar.Action icon="chevron-down" onPress={toggleModal} />
      <Appbar.Content
        title="People Manager"
        subtitle=""
        titleStyle={{ fontSize: 20, fontWeight: "bold" }}
      />
    </Appbar.Header>
    {people.map((x, i) => (
      <ScrollView
        key={`${x}_${i}`} //eslint-disable-line
        style={{ margin: 20 }}
      >
        <KeyboardAvoidingView>
          <TextInput
            label={I18n.t("peopleModal.fname")}
            placeholder={I18n.t("peopleModal.enterFname")}
            onChangeText={(text) => handleInputChange(text, i, "firstName")}
            mode="outlined"
            theme={stylesPaper}
            style={stylesDefault.label}
          />
          <TextInput
            label={I18n.t("peopleModal.lname")}
            placeholder={I18n.t("peopleModal.enterLname")}
            onChangeText={(text) => handleInputChange(text, i, "lastName")}
            mode="outlined"
            theme={stylesPaper}
            style={stylesDefault.label}
          />
          <TextInput
            label={I18n.t("peopleModal.relationship")}
            onChangeText={(text) => handleInputChange(text, i, "relationship")}
            mode="outlined"
            theme={stylesPaper}
            style={stylesDefault.label}
          />
          <View>
            {people.length !== 1 && (
              <PaperButton
                buttonText={I18n.t("peopleModal.remove")}
                onPress={() => handleRemoveClick(i)}
              />
            )}
            {people.length - 1 === i && (
              <PaperButton
                buttonText={I18n.t("peopleModal.add")}
                onPress={handleAddClick}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    ))}
  </>
}

export default PeopleModal;
