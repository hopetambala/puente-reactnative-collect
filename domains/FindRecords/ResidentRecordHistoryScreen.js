/**
 * Resident Record History Screen
 * Lists all form submissions for a resident grouped by type
 * Allows user to view, edit, or delete individual records
 * Part of edit forms feature - Phase 2
 */
import client from '@app/services/parse/client';
import { fetchResidentById } from '@impacto-design-system/Extensions/FindResidents/_utils';
import I18n from '@modules/i18n';
import { MOTION_TOKENS } from '@modules/utils/animations';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, Text, TouchableOpacity, View,
} from 'react-native';
import { Button } from 'react-native-paper';
import Animated, { Keyframe } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// Spec §5.4: section group slides in from below
const SectionEntrance = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 8 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }] },
});

// Spec §5.4: individual record rows, smaller offset
const RowEntrance = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 5 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }] },
});

const Parse = client(false);

// Define record types once, outside component, to prevent infinite loop
// from recordTypes being recreated on every render
const RECORD_TYPES = [
  { parseClass: 'Vitals', label: 'residentHistory.vitals', formType: 'Vitals', usePointer: true },
  {
    parseClass: 'HistoryEnvironmentalHealth',
    label: 'residentHistory.environmentalHealth',
    formType: 'HistoryEnvironmentalHealth',
    usePointer: true,
  },
  {
    parseClass: 'EvaluationMedical',
    label: 'residentHistory.medicalEvaluation',
    formType: 'EvaluationMedical',
    usePointer: true,
  },
  {
    parseClass: 'FormResults',
    label: 'residentHistory.customForms',
    formType: 'FormResults',
    usePointer: true,
  },
];

const ResidentRecordHistoryScreen = ({ navigation, route }) => {
  const { resident } = route.params;
  const [recordsByType, setRecordsByType] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const residentId = resident.objectId;
  // residentName is kept in state so it updates if the user edits the SurveyData record
  // and returns to this screen (navigation params are a stale snapshot).
  const [residentName, setResidentName] = useState(
    `${resident.fname || ''} ${resident.lname || ''}`.trim() || 'Resident'
  );

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const results = {
        // The resident object itself is the identification (SurveyData) record
        SurveyData: {
          label: 'residentHistory.identification',
          records: [resident],
        },
      };

      // Build a Parse pointer to the resident's SurveyData record
      const residentPointer = new Parse.Object('SurveyData');
      residentPointer.id = residentId;

      // Query each record type in parallel
      await Promise.all(
        RECORD_TYPES.map(async (type) => {
          try {
            const Model = Parse.Object.extend(type.parseClass);
            const query = new Parse.Query(Model);
            query.limit(1000);
            query.descending('createdAt');

            if (type.usePointer) {
              // Supplementary forms: 'client' is a Parse pointer to SurveyData
              query.equalTo('client', residentPointer);
            } else {
              // FormResults: 'parseParentClassID' is a plain string objectId
              query.equalTo('parseParentClassID', residentId);
            }

            const records = await query.find();

            if (records && records.length > 0) {
              // Serialize Parse Objects to plain JSON so .get() calls aren't needed later
              const serialized = records
                .map((r) => (r?.toJSON ? r.toJSON() : r))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              results[type.formType] = {
                label: type.label,
                records: serialized,
              };
            }
          } catch (err) {
            console.error(`Error fetching ${type.parseClass}:`, err); // eslint-disable-line
            // Continue querying other types even if one fails
          }
        })
      );

      setRecordsByType(results);
    } catch (err) {
      console.error('Error fetching records:', err); // eslint-disable-line
      setError(err.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  }, [residentId]);

  // Initial fetch on mount
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Re-fetch records and resident name when screen is focused (after returning from edit form)
  useFocusEffect(
    useCallback(() => {
      fetchRecords();
      fetchResidentById(residentId).then((fresh) => {
        if (!fresh) return;
        const name = `${fresh.fname || ''} ${fresh.lname || ''}`.trim();
        if (name) setResidentName(name);
      });
    }, [fetchRecords, residentId])
  );

  const handleRecordPress = (formType, record) => {
    navigation.navigate('EditForm', {
      editMode: true,
      existingRecord: record,
      formType,
      resident,
    });
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }} testID="loadingContainer">
        <Button icon="arrow-left" onPress={() => navigation.goBack()} style={{ margin: 8 }}>{I18n.t('global.back')}</Button>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" testID="loadingIndicator" />
          <Text>{I18n.t('residentHistory.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, padding: 20 }} testID="error-view">
        <Button icon="arrow-left" onPress={() => navigation.goBack()} style={{ marginBottom: 8 }}>{I18n.t('global.back')}</Button>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            {I18n.t('residentHistory.errorLoadingRecords')}
          </Text>
          <Text style={{ textAlign: 'center' }}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getRecordDisplayName = (formType, record) => {
    if (formType === 'FormResults') {
      return record.title || I18n.t('residentHistory.customForm');
    }
    return null;
  };

  // Render sections in a fixed order regardless of which query resolved first.
  // RECORD_TYPES order: Vitals → HistoryEnvironmentalHealth → EvaluationMedical → FormResults
  const SECTION_ORDER = ['SurveyData', ...RECORD_TYPES.map((t) => t.formType)];
  const orderedEntries = SECTION_ORDER
    .filter((key) => recordsByType[key])
    .map((key) => [key, recordsByType[key]]);

  // SurveyData is always present (the resident's identification record).
  // Show empty state only when there are no supplementary form submissions.
  const hasRecords = Object.keys(recordsByType).length > 1;

  if (!hasRecords) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, padding: 20 }}>
        <Button icon="arrow-left" onPress={() => navigation.goBack()} style={{ marginBottom: 8 }}>{I18n.t('global.back')}</Button>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>{I18n.t('residentHistory.noRecordsFound')}</Text>
          <Text style={{ textAlign: 'center' }}>
            {I18n.t('residentHistory.noSubmissionsYet', { name: residentName })}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View>
          <Button icon="arrow-left" onPress={() => navigation.goBack()} style={{ marginBottom: 8, alignSelf: 'flex-start' }}>{I18n.t('global.back')}</Button>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
            {I18n.t('residentHistory.recordHistory')}
            {' '}
            {residentName}
          </Text>

          {orderedEntries.map(([formType, { label, records }], sectionIdx) => (
            <Animated.View
              key={formType}
              style={{ marginBottom: 24 }}
              entering={SectionEntrance
                .delay(sectionIdx * 80)
                .duration(MOTION_TOKENS.duration.base)}
            >
              <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, textTransform: 'capitalize' }}>
                {I18n.t(label)}
              </Text>

              <View>
                {records.map((item, index) => (
                  <Animated.View
                    key={`${formType}-${item.objectId}`}
                    entering={RowEntrance
                      .delay(Math.min(index * 40, 200))
                      .duration(MOTION_TOKENS.duration.base)}
                  >
                    <TouchableOpacity
                      testID={`${item.objectId}`}
                      onPress={() => handleRecordPress(formType, item)}
                      style={{
                        padding: 12,
                        marginBottom: 8,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '500' }}>
                        {getRecordDisplayName(formType, item) || label}
                        {' - '}
                        {formatDate(item.createdAt)}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ResidentRecordHistoryScreen;
