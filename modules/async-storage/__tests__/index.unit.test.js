import AsyncStorage from '@react-native-async-storage/async-storage';
import { storeData, getData, getAllData, deleteData } from '../index';

jest.mock('@react-native-async-storage/async-storage');

describe('storeData', () => {
  it('should throw when AsyncStorage.setItem fails', async () => {
    AsyncStorage.setItem.mockRejectedValue(new Error('storage full'));

    await expect(storeData({ foo: 'bar' }, 'testKey')).rejects.toThrow(
      'storage full'
    );
  });
});

describe('getData', () => {
  it('should throw when AsyncStorage.getItem throws, not swallow the error', async () => {
    AsyncStorage.getItem.mockRejectedValue(new Error('disk read error'));

    await expect(getData('anyKey')).rejects.toThrow('disk read error');
  });
});

describe('getAllData', () => {
  it('should throw when AsyncStorage.getAllKeys throws, not swallow the error', async () => {
    AsyncStorage.getAllKeys.mockRejectedValue(new Error('keys read error'));

    await expect(getAllData()).rejects.toThrow('keys read error');
  });
});

describe('deleteData', () => {
  it('should throw when AsyncStorage.removeItem throws, not swallow the error', async () => {
    AsyncStorage.removeItem.mockRejectedValue(new Error('delete failed'));

    await expect(deleteData('anyKey')).rejects.toThrow('delete failed');
  });
});
