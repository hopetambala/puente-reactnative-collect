/* eslint no-param-reassign: ["error",
{ "props": true, "ignorePropertyModificationsFor": ["formikProps"] }] */
import React, {
  useState, useEffect
} from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  View,
  StyleSheet,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import {
  Checkbox, Button, Text
} from 'react-native-paper';

import { Formik } from 'formik';
import * as yup from 'yup';

import { retrieveSignInFunction } from '../../../services/parse/auth';

import { storeData, getData, deleteData } from '../../../modules/async-storage';
import I18n from '../../../modules/i18n';
import { theme } from '../../../modules/theme';

import FormInput from '../../../components/FormikFields/FormInput';
import LanguagePicker from '../../../components/LanguagePicker';
import CredentialsModal from './CredentialsModal';
import TermsModal from '../../../components/TermsModal';
import BlackLogo from '../../../assets/graphics/static/Logo-Black.svg';
import ForgotPassword from './ForgotPassword';
import checkOnlineStatus from '../../../modules/offline';
import { populateCache } from '../../../modules/cached-resources';

// components/FormikFields/PaperInputPicker';
const validationSchema = yup.object().shape({
  username: yup
    .string()
    .label('Username')
    .required(),
  password: yup
    .string()
    .label('Password')
    .required()
    .min(4, 'Seems a bit short...')
});

const SignIn = ({ navigation }) => {
  const [checked, setChecked] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState('en');
  const [visible, setVisible] = useState(false);

  const [forgotPassword, setForgotPassword] = useState(false);

  const load = false;

  useEffect(() => {
    getData('credentials').then((values) => {
      setUser(values);
      if (values != null) {
        setModalVisible(true);
      }
    });
  }, [load]);

  const handleFailedAttempt = () => {
    Alert.alert(
      I18n.t('signIn.unableLogin'),
      I18n.t('signIn.usernamePasswordIncorrect'), [
        { text: 'OK' }
      ],
      { cancelable: true }
    );
  };

  const handleSignUp = () => {
    navigation.navigate('Sign Up');
  };

  const handleSignIn = () => {
    Keyboard.dismiss();
    navigation.navigate('Root');
  };

  const handleSaveCredentials = (values) => {
    Alert.alert(
      I18n.t('signIn.credentials'),
      I18n.t('signIn.saveLoginCreds'),
      [
        {
          text: 'Yes',
          onPress: () => {
            storeData(values, 'credentials');
            navigation.navigate('StorePincode');
          }
        },
        { text: 'No', style: 'cancel' },
      ],
      { cancelable: false }
      // clicking out side of alert will not cancel
    );
  };

  const handleLanguage = (lang) => {
    setLanguage(lang);
    I18n.locale = lang;
  };

  const handleTermsModal = () => {
    setVisible(true);
  };

  const handleForgotPassword = () => {
    setForgotPassword(true);
  };

  const deleteCreds = () => {
    deleteData('credentials');
  };

  const storeUserInformation = (userData) => {
    populateCache(userData);
  };

  return (
    <KeyboardAvoidingView
      enabled
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ backgroundColor: theme.colors.accent, flex: 1 }}
    >
      {!forgotPassword && (
        <SafeAreaView style={{ flex: 9 }}>
          <ScrollView keyboardShouldPersistTaps="always">
            <LanguagePicker language={language} onChangeLanguage={handleLanguage} />
            <Formik
              initialValues={{ username: '', password: '' }}
              onSubmit={(values, actions) => {
                checkOnlineStatus().then((connected) => {
                  if (connected) {
                    retrieveSignInFunction(values.username, values.password).then((userData) => {
                      getData('credentials').then((userCreds) => {
                        // credentials saved do not match those entered, overwrite saved
                        // credentials
                        if (userCreds === null || values.username !== userCreds.username
                          || values.password !== userCreds.password) {
                          // Store user organization
                          storeUserInformation(userData);
                          handleSaveCredentials(values);
                        } else {
                          storeUserInformation(userData);
                        }
                      }, () => {
                        // Store user organization
                        storeUserInformation(userData);
                        // no credentials saved, give option to save
                        handleSaveCredentials(values);
                      });
                      handleSignIn(values, actions.resetForm());
                    }, (err) => {
                      handleFailedAttempt(err);
                    });
                  } else {
                    // offline
                    getData('credentials').then((userCreds) => {
                      // username and password entered (or saved in creds) match the saved cred
                      if (values.username === userCreds.username
                        && values.password === userCreds.password) {
                        // need some pincode verification
                        handleSignIn(values, actions.resetForm());
                      } else {
                        // cannot log in offline without saved credentials, connect to internet
                      }
                    });
                  }
                });
                setTimeout(() => {
                  actions.setSubmitting(false);
                }, 1000);
              }}
              validationSchema={validationSchema}
              validateOnBlur={false}
              validateOnChange={false}
            >
              {(formikProps) => (
                <View>
                  <View style={styles.logoContainer}>
                    <BlackLogo height={130} />
                  </View>
                  <FormInput
                    label={I18n.t('signIn.username')}
                    formikProps={formikProps}
                    formikKey="username"
                    placeholder="johndoe@example.com"
                    value={formikProps.values.username}
                  />
                  <FormInput
                    label={I18n.t('signIn.password')}
                    formikProps={formikProps}
                    formikKey="password"
                    placeholder="Password"
                    secureTextEntry={!checked}
                    value={formikProps.values.password}
                  />
                  <View style={{ flexDirection: 'row' }}>
                    <View style={styles.container}>
                      <View style={styles.checkbox}>
                        <Checkbox
                          disabled={false}
                          // theme={theme}
                          color={theme.colors.primary}
                          status={checked ? 'checked' : 'unchecked'}
                          onPress={() => {
                            setChecked(!checked);
                          }}
                        />
                      </View>
                      <Text style={styles.passwordText}>{I18n.t('signIn.showPassword')}</Text>
                    </View>
                    <Button style={{ flex: 1 }} onPress={handleForgotPassword}>
                      Forgot password?
                    </Button>
                  </View>
                  {formikProps.isSubmitting ? (
                    <ActivityIndicator />
                  ) : (
                    <Button mode="contained" theme={theme} style={styles.submitButton} onPress={formikProps.handleSubmit}>{I18n.t('signIn.login')}</Button>
                  )}
                  <CredentialsModal
                    modalVisible={modalVisible}
                    formikProps={formikProps}
                    user={user}
                    setModalVisible={setModalVisible}
                    navigation={navigation}
                  />

                </View>
              )}
            </Formik>
            <Button onPress={deleteCreds}>{I18n.t('signIn.deleteCreds')}</Button>
          </ScrollView>

          <TermsModal visible={visible} setVisible={setVisible} />
        </SafeAreaView>
      )}
      {
        forgotPassword && (
          <ForgotPassword
            navigation={navigation}
            forgotPassword={forgotPassword}
            setForgotPassword={setForgotPassword}
          />
        )
      }

      {
        !forgotPassword && (
          <View style={styles.footer}>
            <View style={styles.termsContainer}>
              <Text style={styles.accountText}>{I18n.t('signIn.noAccount')}</Text>
              <Button mode="text" theme={theme} color="#3E81FD" onPress={handleSignUp} labelStyle={{ marginLeft: 5 }}>
                Sign up!
              </Button>
            </View>
            <View style={styles.termsContainer}>
              <Text style={styles.puenteText}>{I18n.t('signIn.puente2020')}</Text>
              <Button mode="text" theme={theme} onPress={handleTermsModal} labelStyle={{ marginLeft: 5 }}>{I18n.t('signIn.termsConditions')}</Button>
            </View>
          </View>
        )
      }

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flex: 1,
    marginLeft: 15
  },
  passwordText: {
    flex: 7,
    fontSize: 15,
    marginLeft: 10,
    marginTop: 'auto',
    marginBottom: 'auto'
  },
  checkbox: {
    flex: 2,
    borderRadius: 5,
    // marginLeft: 0,
    backgroundColor: 'white'
  },
  submitButton: {
    marginLeft: 20,
    marginRight: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  footer: {
    flex: 1
  },
  termsContainer: {
    flexDirection: 'row',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  puenteText: {
    fontSize: 15,
    marginTop: 'auto',
    marginBottom: 'auto'

  },
  accountText: {
    fontSize: 18,
    marginTop: 'auto',
    marginBottom: 'auto'
  },
  logoContainer: {
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  }

});

export default SignIn;
