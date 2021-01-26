import { Platform } from 'react-native';
import * as Network from 'expo-network';
import NetInfo from '@react-native-community/netinfo';

// checks whether user is connected to internet, return true if connected, false otherwise
const checkOnlineStatus = () => new Promise((resolve, reject) => {
  if (Platform.OS === 'ios') {
    Network.getNetworkStateAsync().then((status) => {
      resolve(status.isConnected);
    }, (error) => {
      reject(error);
    });
  } else {
    NetInfo.fetch().then((state) => {
      resolve(state.isConnected);
    }, (error) => {
      reject(error);
    });
  }
});

export default checkOnlineStatus;
