/**
 * Resident Record History Screen
 * Lists all form submissions for a resident grouped by type
 * Allows user to view, edit, or delete individual records
 * Part of edit forms feature - Phase 2
 */
import { customQueryService } from '@app/services/parse/crud';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, ScrollView, Text, TouchableOpacity, View,
} from 'react-native';
import { Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const ResidentRecordHistoryScreen = ({ navigation, route }) => {
  const { resident } = route.params;
  const [recordsByType, setRecordsByType] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const residentId = resident.objectId;
  // resident arrives as a plain object via navigation params (Parse Objects serialize over navigation)
  const residentName = `${resident.fname || ''} ${resident.lname || ''}`.trim() || 'Resident';

  // Define record types to query
  // Supplementary forms (Vitals, EvaluationMedical, HistoryEnvironmentalHealth) are linked
  // to SurveyData via a pointer column named after the parent class ("SurveyData").
  // FormResults use a plain string field "parseParentClassID".
  // The resident object itself IS the SurveyData (identification) record — no query needed.
  const recordTypes = [
    { parseClass: 'Vitals', label: 'Vitals', formType: 'Vitals', column: 'SurveyData' },
    {
      parseClass: 'HistoryEnvironmentalHealth',
      label: 'Environmental Health',
      formType: 'HistoryEnvironmentalHealth',
      column: 'SurveyData',
    },
    {
      parseClass: 'EvaluationMedical',
      label: 'Medical Evaluation',
      formType: 'EvaluationMedical',
      column: 'SurveyData',
    },
    {
      parseClass: 'FormResults',
      label: 'Custom Forms',
      formType: 'FormResults',
      column: 'parseParentClassID',
    },
  ];

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        setError(null);

        const results = {
          // The resident object itself is the identification (SurveyData) record
          SurveyData: {
            label: 'Identification',
            records: [resident],
          },
        };

        // Query each record type in parallel
        await Promise.all(
          recordTypes.map(async (type) => {
            try {
              const records = await customQueryService(
                0,
                1000,
                type.parseClass,
                type.column,
                residentId
              );

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
    };

    fetchRecords();
  }, [residentId]);

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
        <Button icon="arrow-left" onPress={() => navigation.goBack()} style={{ margin: 8 }}>Back</Button>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" testID="loadingIndicator" />
          <Text>Loading record history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, padding: 20 }} testID="error-view">
        <Button icon="arrow-left" onPress={() => navigation.goBack()} style={{ marginBottom: 8 }}>Back</Button>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            Error loading records
          </Text>
          <Text style={{ textAlign: 'center' }}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasRecords = Object.keys(recordsByType).length > 0;

  if (!hasRecords) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, padding: 20 }}>
        <Button icon="arrow-left" onPress={() => navigation.goBack()} style={{ marginBottom: 8 }}>Back</Button>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>No records found</Text>
          <Text style={{ textAlign: 'center' }}>
            {residentName} has no form submissions yet.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <Button icon="arrow-left" onPress={() => navigation.goBack()} style={{ marginBottom: 8, alignSelf: 'flex-start' }}>Back</Button>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        Record History:
        {' '}
        {residentName}
      </Text>

      {Object.entries(recordsByType).map(([formType, { label, records }]) => (
        <View key={formType} style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, textTransform: 'capitalize' }}>
            {label}
          </Text>

          <FlatList
            scrollEnabled={false}
            data={records}
            keyExtractor={(item, idx) => `${formType}-${item.objectId}-${idx}`}
            renderItem={({ item }) => (
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
                  {label}
                  {' - '}
                  {formatDate(item.createdAt)}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ResidentRecordHistoryScreen;
