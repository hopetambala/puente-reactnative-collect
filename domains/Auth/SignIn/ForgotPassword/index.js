import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text, Button
} from 'react-native-paper';
import { Formik } from 'formik';
import { theme } from '../../../../modules/theme';
import { retrieveForgotPasswordFunction } from '../../../../services/parse/auth';
import FormInput from '../../../../components/FormikFields/FormInput';
import I18n from '../../../../modules/i18n';

export default function ForgotPassword({ navigation, setForgotPassword }) {
  const handleSignUp = () => {
    navigation.navigate('Sign Up');
  };

  const handleSignIn = () => {
    setForgotPassword(false);
  };

  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState(false);

  return (
    <View style={{ flex: 1, marginHorizontal: 15, marginTop: 50 }}>
      <View style={{ flex: 9 }}>
        <Button icon="arrow-left" width={100} onPress={handleSignIn}>
          Back
        </Button>
        {!emailError && !emailSuccess && (
          <View>
            <Formik
              initialValues={{ email: '' }}
              onSubmit={(values, actions) => {
                retrieveForgotPasswordFunction(values).then((res) => {
                  setEmailSuccess(true);
                  console.log(res); //eslint-disable-line
                }, (error) => {
                  setEmailError(true);
                  console.log(error); //eslint-disable-line
                });
                setTimeout(() => {
                  actions.setSubmitting(false);
                }, 1000);
              }}
            >
              {(formikProps) => (
                <View>
                  <View>
                    <Text style={{ marginHorizontal: 15, fontSize: 20, fontWeight: 'bold' }}>{I18n.t('signIn.forgotPassword.enterEmail')}</Text>
                    <FormInput
                      label="Email"
                      formikProps={formikProps}
                      formikKey="email"
                      placeholder="Email"
                    />
                  </View>
                  <Button mode="contained" theme={theme} onPress={formikProps.handleSubmit}>{I18n.t('signIn.forgotPassword.sendLink')}</Button>
                </View>

              )}
            </Formik>
          </View>
        )}
        {emailSuccess && (
          <View>
            <Text style={{ marginHorizontal: 15, fontSize: 18, fontWeight: 'bold' }}>
              Your password reset link has been sent to your email. Please
              Check your email to change your password.
            </Text>
            <Button mode="text" theme={theme} onPress={handleSignIn}>Back to Sign in</Button>
          </View>
        )}
        {emailError && (
          <View>
            <Text style={{ marginHorizontal: 15, fontSize: 18, fontWeight: 'bold' }}>
              There was an error sending the password reset link. Please
              ensure that you entered your email correctly. You can try again by clicking
              the button below. If you believe the email is correct, please contact your manager.
            </Text>
            <Button style={{ marginTop: 10 }} mode="contained" onPress={() => setEmailError(false)}>Try Again</Button>
          </View>
        )}
      </View>
      <View style={styles.footer}>
        <View style={styles.termsContainer}>
          <Text style={styles.accountText}>{I18n.t('signIn.forgotPassword.noAccount')}</Text>
          <Button mode="text" theme={theme} color="#3E81FD" onPress={handleSignUp} labelStyle={{ marginLeft: 5 }}>
            {I18n.t('signIn.forgotPassword.signUp')}
          </Button>
        </View>
        <View style={styles.termsContainer}>
          <Text style={styles.puenteText}>{I18n.t('signIn.forgotPassword.rememberPass')}</Text>
          <Button mode="text" theme={theme} onPress={handleSignIn} labelStyle={{ marginLeft: 5 }}>{I18n.t('signIn.forgotPassword.signIn')}</Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: 40
  }

});
