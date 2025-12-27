import I18n from "@modules/i18n";
import { layout } from "@modules/theme";
import React, { useEffect, useState } from "react";
import { Image, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Text, Title } from "react-native-paper";

function ResidentCard({ resident, onSelectPerson }) {
  const { fname, lname, nickname, city, picture, communityname, objectId } =
    resident;
  const [pictureUrl, setPictureUrl] = useState();
  useEffect(() => {
    const pic = picture;
    if (pic) {
      setPictureUrl({ uri: pic.url });
    }
  }, []);

  return (
    <View>
      <TouchableOpacity
        style={layout.resCardContainer}
        onPress={() => {
          if (onSelectPerson) onSelectPerson(resident);
        }}
      >
        <View style={layout.resCardNameContainer}>
          <Title style={layout.resCardName}>{`${fname} ${lname}`}</Title>
          {objectId.includes("PatientID-") && (
            <View style={layout.resCardRedCircle} />
          )}
        </View>
        <Text style={layout.resCardNickname}>{`"${nickname}"`}</Text>
        <Image style={layout.resCardProfPic} source={pictureUrl} />
        <View style={layout.resCardCityLicenseContainer}>
          <View style={layout.resCardCityContainer}>
            <Text style={layout.resCardFont}>
              {I18n.t("findResident.residentCard.city")}
            </Text>
            <Text style={layout.resCardFont}>{city}</Text>
          </View>
          <View style={layout.resCardLicenseContainer}>
            <Text style={layout.resCardFont}>
              {I18n.t("findResident.residentCard.community")}
            </Text>
            <Text style={layout.resCardLicense}>{communityname}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default ResidentCard;
