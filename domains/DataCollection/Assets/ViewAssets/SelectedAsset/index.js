import I18n from "@modules/i18n";
import { createLayoutStyles } from "@modules/theme";
import React from "react";
import { View } from "react-native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import { Text, Title,useTheme  } from "react-native-paper";

function SelectedAsset({ selectedMarker, switchAssetPage }) {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);
  return <TouchableWithoutFeedback
    onPress={
      switchAssetPage
        ? () => switchAssetPage("assetSupplementary", selectedMarker)
        : (e) => e
    }
    style={layout.resCardContainer}
  >
    <View style={layout.resCardNameContainer}>
      <Title style={layout.resCardName}>
        {selectedMarker.name || selectedMarker.Name}
      </Title>
    </View>

    <View style={layout.resCardCityLicenseContainer}>
      <View style={layout.resCardLicenseContainer}>
        <Text style={layout.resCardFont}>
          {I18n.t("findResident.residentCard.community")}
        </Text>
        <Text style={layout.resCardLicense}>
          {selectedMarker.communityName}
        </Text>
      </View>
      {selectedMarker.relatedPeople &&
        selectedMarker.relatedPeople.map((person) => (
          <View
            key={`${person.lastName}_${person.firstName}`}
            style={layout.resCardLicenseContainer}
          >
            <Text style={layout.resCardFont}>Related People</Text>
            <Text style={layout.resCardFont}>
              {person.firstName}, {person.lastName}{" "}
            </Text>
          </View>
        ))}
    </View>
  </TouchableWithoutFeedback>
}

export default SelectedAsset;
