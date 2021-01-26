import React, { useEffect, useState } from 'react';
import {
  View, StyleSheet, Image
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import {
  Text, Title
} from 'react-native-paper';

import { theme } from '../../../../modules/theme';

import I18n from '../../../../modules/i18n';

const ResidentCard = ({
  resident, onSelectPerson
}) => {
  const {
    fname, lname, nickname, city, picture, communityname, objectId
  } = resident;
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
        style={styles.container}
        onPress={() => {
          if (onSelectPerson) onSelectPerson(resident);
        }}
      >
        <View style={styles.nameContainer}>
          <Title style={styles.name}>{`${fname} ${lname}`}</Title>
          {objectId.includes('PatientID-') && (
            <View style={styles.redCircle} />
          )}
        </View>
        <Text style={styles.nickname}>{`"${nickname}"`}</Text>
        <Image
          style={styles.profPic}
          source={pictureUrl}
        />
        <View style={styles.cityLicenseContainer}>
          <View style={styles.cityContainer}>
            <Text style={styles.font}>{I18n.t('findResident.residentCard.city')}</Text>
            <Text style={styles.font}>{city}</Text>
          </View>
          <View style={styles.licenseContainer}>
            <Text style={styles.font}>{I18n.t('findResident.residentCard.community')}</Text>
            <Text style={styles.license}>{communityname}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.colors.primary
  },
  nameContainer: {
    backgroundColor: theme.colors.primary,
    marginTop: 15,
    height: 30,
    flexDirection: 'row'
  },
  name: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 15,
    marginTop: 'auto',
    marginBottom: 'auto'
  },
  nickname: {
    marginLeft: 15,
    marginTop: 5,
    color: '#606060',
    fontSize: 15
  },
  profPic: {
    height: 70,
    width: 70,
    position: 'absolute',
    right: 15,
    top: 20
  },
  cityLicenseContainer: {
    flexDirection: 'row',
    marginTop: 40,
    marginBottom: 15
  },
  cityContainer: {
    flexDirection: 'column',
    marginRight: 'auto',
    marginLeft: 15,
  },
  licenseContainer: {
    flexDirection: 'column',
    marginLeft: 'auto',
    marginRight: 15,
  },
  license: {
    marginLeft: 'auto',
    color: '#606060',
    fontSize: 15
  },
  font: {
    color: '#606060',
    fontSize: 15
  },
  redCircle: {
    backgroundColor: '#f8380e',
    width: 15,
    height: 15,
    marginLeft: 10,
    marginTop: 'auto',
    marginBottom: 'auto',
    borderRadius: 20
  }

});

export default ResidentCard;
