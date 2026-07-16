/**
 * Resident Record History Screen
 * Lists all form submissions for a resident grouped by type
 * Allows user to view, edit, or delete individual records
 * Part of edit forms feature - Phase 2
 */
import client from '@app/services/parse/client';
import { fetchResidentById } from '@impacto-design-system/Extensions/FindResidents/_utils';
import I18n from '@modules/i18n';
import checkOnlineStatus from '@modules/offline';
import { spacing, typography } from '@modules/theme';
import { getStaggerDelay } from '@modules/utils/animationRules';
import { MOTION_TOKENS } from '@modules/utils/animations';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Button, useTheme } from 'react-native-paper';
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
  const theme = useTheme();
  const styles = createStyles(theme);
  const { resident, fromTab } = route.params;

  const handleBack = () => {
    if (fromTab) {
      // Navigate to the originating tab first, then reset FindRecords to its
      // initial screen. CommonActions.reset is always handled by the current
      // navigator and never propagates — unlike goBack()/pop() which propagate
      // when the stack is at depth 1 and reach MainNavigation → Sign In.
      navigation.getParent()?.navigate(fromTab);
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'FindRecordsHome' }] })
      );
    } else {
      navigation.goBack();
    }
  };
  const [recordsByType, setRecordsByType] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(false);

  const residentId = resident.objectId;
  // residentName is kept in state so it updates if the user edits the SurveyData record
  // and returns to this screen (navigation params are a stale snapshot).
  const [residentName, setResidentName] = useState(
    `${resident.fname || ''} ${resident.lname || ''}`.trim() || I18n.t('residentHistory.resident')
  );

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Offline, every per-type query below would just burn its own network
      // timeout before failing — skip them and show the offline notice with
      // the identification record we already have from route params.
      const connected = await checkOnlineStatus();
      setOffline(!connected);

      const results = {
        // The resident object itself is the identification (SurveyData) record
        SurveyData: {
          label: 'residentHistory.identification',
          records: [resident],
        },
      };

      if (!connected) {
        setRecordsByType(results);
        return;
      }

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
      // Boolean on purpose: raw error text is never shown to field workers —
      // the error view renders the translated residentHistory.errorBody copy.
      setError(true);
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
    if (!date) return I18n.t('residentHistory.unknownDate');
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen} testID="loadingContainer">
        <Button icon="arrow-left" onPress={handleBack} style={styles.backButton}>{I18n.t('global.back')}</Button>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} testID="loadingIndicator" />
          <Text style={styles.loadingText}>{I18n.t('residentHistory.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={['top']} style={styles.errorScreen} testID="error-view">
        <Button icon="arrow-left" onPress={handleBack} style={styles.backButtonSpaced}>{I18n.t('global.back')}</Button>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>
            {I18n.t('residentHistory.errorLoadingRecords')}
          </Text>
          <Text style={styles.errorMessage}>{I18n.t('residentHistory.errorBody')}</Text>
          <Button mode="contained" onPress={fetchRecords} style={styles.retryButton}>
            {I18n.t('global.tryAgain')}
          </Button>
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

  // True only when supplementary forms exist beyond the always-present SurveyData record.
  const hasSupplementaryRecords = Object.keys(recordsByType).length > 1;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView style={styles.scroll}>
        <View>
          <Button icon="arrow-left" onPress={handleBack} style={styles.backButtonInline}>{I18n.t('global.back')}</Button>
          <Text style={styles.title}>
            {I18n.t('residentHistory.recordHistory')}
            {' '}
            {residentName}
          </Text>

          {orderedEntries.map(([formType, { label, records }], sectionIdx) => (
            <Animated.View
              key={formType}
              style={styles.section}
              entering={SectionEntrance
                .delay(sectionIdx * getStaggerDelay(orderedEntries.length))
                .duration(MOTION_TOKENS.duration.base)}
            >
              <Text style={styles.sectionHeader}>
                {I18n.t(label)}
              </Text>

              <View>
                {records.map((item, index) => (
                  <Animated.View
                    // eslint-disable-next-line react/no-array-index-key
                    key={`${formType}-${item.objectId || index}-${index}`}
                    entering={RowEntrance
                      .delay(index * getStaggerDelay(records.length))
                      .duration(MOTION_TOKENS.duration.base)}
                  >
                    <TouchableOpacity
                      testID={`${item.objectId}`}
                      onPress={() => handleRecordPress(formType, item)}
                      style={styles.recordRow}
                    >
                      <Text style={styles.recordText}>
                        {getRecordDisplayName(formType, item) || I18n.t(label)}
                        {' - '}
                        {formatDate(item.createdAt)}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          ))}

          {!hasSupplementaryRecords && (
            <Text style={styles.emptyText}>
              {offline
                ? I18n.t('residentHistory.offlineNotice')
                : I18n.t('residentHistory.noSubmissionsYet', { name: residentName })}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  errorScreen: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    margin: spacing.sm,
  },
  backButtonSpaced: {
    marginBottom: spacing.sm,
  },
  backButtonInline: {
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  loadingText: {
    color: theme.colors.onBackground,
  },
  errorTitle: {
    ...typography.title2,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: theme.colors.onBackground,
  },
  errorMessage: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  retryButton: {
    marginTop: spacing.lg,
  },
  title: {
    ...typography.title1,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    color: theme.colors.onBackground,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    ...typography.title2,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textTransform: 'capitalize',
    color: theme.colors.onBackground,
  },
  recordRow: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: spacing.radiusMedium,
  },
  recordText: {
    ...typography.label1,
    color: theme.colors.onSurface,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.lg,
  },
});

export default ResidentRecordHistoryScreen;
