import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Modal, Portal, Text, Button
} from 'react-native-paper';

// STYLING
import { theme } from '../../../../modules/theme';
import I18n from '../../../../modules/i18n';

export default function CredentialsModal(props) {
  const {
    modalVisible, setModalVisible, user, navigation,
    formikProps: { values }
  } = props;
  return (
    <Portal theme={theme}>
      <Modal
        visible={modalVisible}
        theme={theme}
        contentContainerStyle={styles.modal}
        dismissable={false}
      >
        <View>
          <Text>{I18n.t('signIn.credentialsModal.useCreds')}</Text>
          <View style={styles.buttonContainer}>
            <View style={styles.button}>
              <Button
                mode="contained"
                theme={theme}
                onPress={() => {
                  setModalVisible(!modalVisible);
                  values.username = user.username;
                  values.password = user.password;
                  navigation.navigate('GetPincode');
                }}
              >
                {I18n.t('global.yes')}
              </Button>
            </View>
            <View style={styles.button}>
              <Button
                mode="contained"
                theme={theme}
                onPress={() => {
                  setModalVisible(!modalVisible);
                }}
              >
                {I18n.t('global.no')}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    padding: 30,
    margin: 30
  },
  button: {
    flex: 1,
    margin: 5
  },
  buttonContainer: {
    flexDirection: 'row',
    margin: 20
  }
});
