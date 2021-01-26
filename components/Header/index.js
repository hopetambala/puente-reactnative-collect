import React, { useState } from 'react';
import { View } from 'react-native';
import {
  Headline, Text, IconButton, Button,
} from 'react-native-paper';
import Emoji from 'react-native-emoji';

import countService from '../../services/parse/calculate';

import { deleteData, getData } from '../../modules/async-storage';
import { postOfflineForms } from '../../modules/cached-resources';

import styles from './index.styles';

import I18n from '../../modules/i18n';

import handleParseError from '../../modules/cached-resources/error-handling';

const Header = ({ logOut }) => {
  const { header, headerText, headerIcon } = styles;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [surveyCount, setSurveyCount] = useState(0);
  const [volunteerDate, setVolunteerDate] = useState('');
  const [volunteerGreeting, setVolunteerGreeting] = useState('');
  const [offlineForms, setOfflineForms] = useState(false);
  const [offlineFormCount, setOfflineFormCount] = useState(0);
  const [submission, setSubmission] = useState(null);

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
      const userName = `${user.firstname || ''} ${user.lastname || ''}`;
      calculateTime(user.firstname);
      setVolunteerDate(volunteerLength(user));
      countService('SurveyData', 'surveyingUser', userName).then((counts) => {
        setSurveyCount(counts);
      });
    });

    getData('offlineIDForms').then((idForms) => {
      if (idForms) {
        setOfflineForms(true);
        return idForms.length;
      }
      return 0;
    })
      .then((idFormCount) => {
        getData('offlineSupForms').then((supForms) => {
          if (supForms) {
            setOfflineForms(true);
            setOfflineFormCount(idFormCount + supForms.length);
          } else {
            setOfflineFormCount(idFormCount);
            if (idFormCount === 0) {
              setOfflineForms(false);
            } else {
              setOfflineForms(true);
            }
          }
        });
      });

    setDrawerOpen(!drawerOpen);
  };

  const postOffline = () => {
    postOfflineForms().then(async (result) => {
      if (result) {
        await deleteData('offlineIDForms');
        await deleteData('offlineSupForms');
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
          await deleteData('offlineHouseholds');
          await deleteData('offlineHouseholdsRelation');
          setOfflineForms(false);
          setSubmission(true);
        }
      }, () => {
        setSubmission(false);
      });
    });
    // .catch(() => {
    //   setSubmission(false);
    // });
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
          {logOut && (
            <IconButton
              icon="logout"
              color={headerIcon.color}
              size={30}
              onPress={logOut}
            />
          )}
        </View>
      </View>
      {drawerOpen === true
        && (
          <View>
            <Headline style={styles.calculationText}>
              {volunteerGreeting}
              <Emoji name="coffee" />
            </Headline>
            <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
              <Text style={styles.calculationText}>{`${I18n.t('header.volunteerSince')}\n${volunteerDate}`}</Text>
              <Text style={styles.calculationText}>{`${I18n.t('header.surveysCollected')}\n${surveyCount}`}</Text>
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
