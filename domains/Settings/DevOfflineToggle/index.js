import { deleteData,getData, storeData } from '@modules/async-storage';
import { getTokens } from '@modules/theme/tokens';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Switch, Text, useTheme } from 'react-native-paper';

const DEV_FORCE_OFFLINE_KEY = 'DEV_FORCE_OFFLINE';

export default function DevOfflineToggle() {
  const { dark } = useTheme();
  const t = getTokens(dark ? 'dark' : 'light');
  const [isForceOffline, setIsForceOffline] = useState(false);

  useEffect(() => {
    if (!__DEV__) return;
    getData(DEV_FORCE_OFFLINE_KEY).then((value) => {
      setIsForceOffline(!!value);
    });
  }, []);

  if (!__DEV__) return null;

  const handleToggle = async () => {
    if (isForceOffline) {
      await deleteData(DEV_FORCE_OFFLINE_KEY);
      setIsForceOffline(false);
    } else {
      await storeData(true, DEV_FORCE_OFFLINE_KEY);
      setIsForceOffline(true);
    }
  };

  const styles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: t.tkDliteSemanticSpacing400,
    },
    label: {
      color: t.tkDliteSemanticColorTextPrimary,
    },
    status: {
      color: t.tkDliteSemanticColorTextPrimary,
    },
  });

  return (
    <View style={styles.row}>
      <Text style={styles.label}>Force Offline Mode</Text>
      <Text style={styles.status}>{isForceOffline ? 'ON' : 'OFF'}</Text>
      <Switch
        testID="dev-offline-toggle"
        value={isForceOffline}
        onValueChange={handleToggle}
      />
    </View>
  );
}
