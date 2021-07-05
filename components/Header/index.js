import React, { useState } from 'react';
import { View } from 'react-native';
import Emoji from 'react-native-emoji';
import {
  Button,
  Headline, IconButton, Text,
} from 'react-native-paper';

import { deleteData, getData } from '../../modules/async-storage';
import { postOfflineForms } from '../../modules/cached-resources';
import handleParseError from '../../modules/cached-resources/error-handling';
import I18n from '../../modules/i18n';
import FormCounts from './FormCounts';
import styles from './index.styles';

const Header = ({
  setSettings
}) => {
  const { header, headerText, headerIcon } = styles;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [volunteerDate, setVolunteerDate] = useState('');
  const [volunteerGreeting, setVolunteerGreeting] = useState('');
  const [offlineForms, setOfflineForms] = useState(false);
  const [offlineFormCount, setOfflineFormCount] = useState(0);
  const [submission, setSubmission] = useState(null);
  const [showCounts, setShowCounts] = useState(false);

  const volunteerLength = (object) => {
    const date = new Date(object.createdAt);
    const convertedDate = date.toDateString();
    return convertedDate;
  };

  const calculateTime = (name) => {
    const today = new Date();
    const curHr = today.getHours();

    if (curHr < 12) {
      setVolunteerGreeting(`${I18n.t('header.goodMorning')} ${name}!` || I18n.t('header.goodMorning!'));
    } else if (curHr < 18) {
      setVolunteerGreeting(`${I18n.t('header.goodAfternoon')} ${name}!` || I18n.t('header.goodAfternoon!'));
    } else {
      setVolunteerGreeting(`${I18n.t('header.goodEvening')} ${name}!` || I18n.t('header.goodEvening!'));
    }
  };

  const count = async () => {
    getData('currentUser').then((user) => {
      calculateTime(user.firstname);
      setVolunteerDate(volunteerLength(user));
    });

    const idFormCount = await getData('offlineIDForms').then((idForms) => {
      if (idForms) {
        setOfflineForms(true);
        return idForms.length;
      }
      return 0;
    });

    const supplementaryCount = await getData('offlineSupForms').then((supForms) => {
      if (supForms) {
        setOfflineForms(true);
        return supForms.length;
      }
      return 0;
    });

    const assetIdFormCount = await getData('offlineAssetIDForms').then((assetIdForms) => {
      if (assetIdForms) {
        setOfflineForms(true);
        return assetIdForms.length;
      }
      return 0;
    });

    const assetSupForms = await getData('offlineAssetSupForms').then((assetSuppForms) => {
      if (assetSuppForms) {
        setOfflineForms(true);
        return assetSuppForms.length;
      }
      return 0;
    });

    const allFormOfflineCount = idFormCount + supplementaryCount + assetIdFormCount + assetSupForms;

    setOfflineFormCount(allFormOfflineCount);

    setOfflineForms(allFormOfflineCount > 0);

    setDrawerOpen(!drawerOpen);
  };

  const postOffline = () => {
    postOfflineForms().then(async (result) => {
      if (result) {
        await deleteData('offlineIDForms');
        await deleteData('offlineSupForms');
        await deleteData('offlineAssetIDForms');
        await deleteData('offlineAssetSupForms');
        await deleteData('offlineHouseholds');
        await deleteData('offlineHouseholdsRelation');
        setOfflineForms(false);
        setSubmission(true);
      }
    }, (error) => {
      // handle session token error
      handleParseError(error, postOfflineForms).then(async (result) => {
        if (result) {
          await deleteData('offlineIDForms');
          await deleteData('offlineSupForms');
          await deleteData('offlineAssetIDForms');
          await deleteData('offlineAssetSupForms');
          await deleteData('offlineHouseholds');
          await deleteData('offlineHouseholdsRelation');
          setOfflineForms(false);
          setSubmission(true);
        }
      }, () => {
        setSubmission(false);
      });
    });
  };

  const navToSettings = () => {
    setDrawerOpen(false);
    setSettings(true);
  };

  const navToCounts = () => {
    setShowCounts(true);
  };

  return (
    <View style={styles.container}>
      <View style={header}>
        <Text style={headerText}>{I18n.t('header.puente')}</Text>
        <View style={headerIcon}>
          <IconButton
            color={headerIcon.color}
            size={30}
          />
        </View>
        <View style={headerIcon}>
          <IconButton
            icon="tune"
            color={headerIcon.color}
            size={30}
            onPress={navToSettings}
          />
        </View>
      </View>
      {drawerOpen === true
        && (
          <View>
            {showCounts === false ? (
              <View>
                <Headline style={styles.calculationText}>
                  {volunteerGreeting}
                  <Emoji name="coffee" />
                </Headline>
                <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
                  <Text style={styles.calculationText}>{`${I18n.t('header.volunteerSince')}\n${volunteerDate}`}</Text>
                </View>
                {offlineForms ? (
                  <Button onPress={postOffline}>
                    {I18n.t('header.submitOffline')}
                  </Button>
                ) : (
                  <Button disabled>{I18n.t('header.submitOffline')}</Button>
                )}
                {submission === false && (
                  <View>
                    <Text style={styles.calculationText}>{I18n.t('header.failedAttempt')}</Text>
                    <Text style={{ alignSelf: 'center' }}>{I18n.t('header.tryAgain')}</Text>
                    <Button onPress={() => setSubmission(null)}>{I18n.t('header.ok')}</Button>
                  </View>
                )}
                {submission === true && (
                  <View>
                    <Text style={styles.calculationText}>{I18n.t('header.success')}</Text>
                    <Text style={{ alignSelf: 'center' }}>
                      {I18n.t('header.justSubmitted')}
                      {' '}
                      {offlineFormCount}
                      {' '}
                      {offlineFormCount > 1 && (
                        <Text>{I18n.t('header.forms')}</Text>)}
                      {offlineFormCount === 1 && (
                        <Text>{I18n.t('header.form')}</Text>)}
                    </Text>
                    <Button onPress={() => setSubmission(null)}>{I18n.t('header.ok')}</Button>
                  </View>
                )}
                <View style={{ flexDirection: 'row' }}>
                  <Button
                    style={styles.calculationText}
                    onPress={navToSettings}
                  >
                    Settings Page
                  </Button>
                  <Button
                    style={styles.calculationText}
                    onPress={navToCounts}
                  >
                    {I18n.t('header.surveysCollected')}
                  </Button>
                </View>
              </View>
            ) : (
              <FormCounts
                setShowCounts={setShowCounts}
              />
            )}
            <Button onPress={navToSettings}>{I18n.t('header.settingsPage')}</Button>
          </View>
        )}
      <IconButton
        size={3}
        style={{
          width: 70, backgroundColor: 'grey', alignSelf: 'center', opacity: 0.5
        }}
        onPress={count}
      />

    </View>
  );
};

export default Header;
