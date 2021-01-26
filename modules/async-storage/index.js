import AsyncStorage from '@react-native-async-storage/async-storage';

const storeData = async (value, storageName) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(storageName, jsonValue);
    return;
  } catch (e) {
    // saving error
    console.log(e); //eslint-disable-line

  }
};

const getData = async (storageName) => {
  try {
    const jsonValue = await AsyncStorage.getItem(storageName);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.log(e); //eslint-disable-line
    return null;
  }
};

const deleteData = async (storageName) => {
  await AsyncStorage.removeItem(storageName);
};

const getAllData = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const result = await AsyncStorage.multiGet(keys);
    return result;
  } catch (e) {
    console.log(e); //eslint-disable-line
    return null;
  }
};

export {
  storeData, getData, deleteData, getAllData
};
