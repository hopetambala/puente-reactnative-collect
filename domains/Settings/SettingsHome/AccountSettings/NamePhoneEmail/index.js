import { Parse } from 'parse/react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, View
} from 'react-native';
import {
  Button, Headline, IconButton, Text, TextInput
} from 'react-native-paper';

import { getData, storeData } from '../../../../../modules/async-storage';
import I18n from '../../../../../modules/i18n';
import { theme } from '../../../../../modules/theme';
import styles from '../../../index.styles';

const NamePhoneEmail = () => {
  useEffect(() => {
    async function setUserInformation() {
      const currentUser = await getData('currentUser');
      setObjectId(currentUser.objectId);
      const fname = currentUser.firstname;
      const lname = currentUser.lastname;
      const phoneNumber = currentUser.phonenumber;
      const { email } = currentUser;

      setUserObject({
        firstName: fname,
        lastName: lname,
        phoneNumber,
        email
      });
    }
    setUserInformation().then(() => {
      setInputs([
        {
          label: I18n.t('namePhoneEmailSettings.userInformation.fname'),
          value: userObject.firstName,
          key: 'firstName'
        },
        {
          label: I18n.t('namePhoneEmailSettings.userInformation.lname'),
          value: userObject.lastName,
          key: 'lastName'
        },
        {
          label: I18n.t('namePhoneEmailSettings.userInformation.phoneNumber'),
          value: userObject.phoneNumber,
          key: 'phoneNumber'
        },
        {
          label: I18n.t('namePhoneEmailSettings.userInformation.email'),
          value: userObject.email,
          key: 'email'
        }
      ]);
      setUpdated(false);
    });
  }, [updated]);

  const [userObject, setUserObject] = useState({});
  const [edit, setEdit] = useState('');
  const [inputs, setInputs] = useState([]);
  const [objectId, setObjectId] = useState('');
  const [updated, setUpdated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const updateUserObject = (key, text) => {
    const copyUserObject = userObject;
    copyUserObject[key] = text;
    setUserObject(copyUserObject);
  };

  const handleFailedAttempt = () => {
    Alert.alert(
      I18n.t('global.error'),
      I18n.t('namePhoneEmailSettings.errorMessage'), [
      { text: 'OK' }
    ],
      { cancelable: true }
    );
  };

  const handleSucccessfullAttempt = () => {
    Alert.alert(
      I18n.t('global.success'),
      I18n.t('namePhoneEmailSettings.successMessage'), [
      { text: 'OK' }
    ],
      { cancelable: true }
    );
  };

  const updateUser = async () => {
    setSubmitting(true);
    const postParams = {
      objectId,
      firstname: userObject.firstName,
      lastname: userObject.lastName,
      email: userObject.email,
      phonenumber: userObject.phoneNumber
    };
    const credentials = await getData('credentials');

    const user = await Parse.User.logIn(credentials.username, credentials.password);
    for (const key in postParams) { //eslint-disable-line
      user.set(String(key), postParams[key]);
    }

    const submitAction = () => {
      setTimeout(() => {
        setSubmitting(false);
        handleSucccessfullAttempt();
      }, 1000);
    };

    await user.save().then(async (updatedUser) => {
      await storeData(updatedUser, 'currentUser').then(() => {
        setUpdated(true);
        submitAction();
      }, (error) => {
        console.log(error); //eslint-disable-line
        setSubmitting(false);
        handleFailedAttempt();
      });
    }, (error) => {
      console.log(error); //eslint-disable-line
      setSubmitting(false);
      handleFailedAttempt();
    });
  };

  return (
    <View>
      <Headline>{I18n.t('namePhoneEmailSettings.namePhoneEmail')}</Headline>
      <View style={styles.horizontalLinePrimary} />
      {inputs.length > 0 && inputs.map((result) => (
        <View key={result.key}>
          <Text style={styles.text}>{result.label}</Text>
          <View>
            {edit !== result.key && (
              <View style={styles.textContainer}>
                <Text style={styles.text}>{userObject[result.key]}</Text>
                <Button
                  style={{ marginLeft: 'auto' }}
                  onPress={() => {
                    setEdit(result.key);
                  }}
                >
                  Edit
                </Button>
              </View>
            )}
            {edit === result.key && (
              <View style={styles.textContainer}>
                <TextInput
                  style={{ flex: 3 }}
                  placeholder={result.value}
                  mode="outlined"
                  onChangeText={(text) => updateUserObject(result.key, text)}
                />
                <View style={styles.buttonContainer}>
                  <IconButton
                    icon="check"
                    size={25}
                    color={theme.colors.primary}
                    style={styles.svg}
                    onPress={() => {
                      setEdit('');
                    }}
                  />
                  <IconButton
                    icon="window-close"
                    size={25}
                    color={theme.colors.primary}
                    style={styles.svg}
                    onPress={() => {
                      setEdit('');
                    }}
                  />
                </View>
              </View>
            )}
          </View>
          <View style={styles.horizontalLineGray} />

        </View>
      ))}
      {submitting ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
        />
      ) : (
          <Button onPress={() => updateUser()}>Submit</Button>
        )}
    </View>
  );
};

export default NamePhoneEmail;
