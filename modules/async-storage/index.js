import AsyncStorage from "@react-native-async-storage/async-storage";

const storeData = async (value, storageName) => {
  const jsonValue = JSON.stringify(value);
  await AsyncStorage.setItem(storageName, jsonValue);
  return value;
};

const getData = async (storageName) => {
  const jsonValue = await AsyncStorage.getItem(storageName);
  return jsonValue != null ? JSON.parse(jsonValue) : null;
};

const deleteData = async (storageName) => {
  await AsyncStorage.removeItem(storageName);
};

const getAllData = async () => {
  const keys = await AsyncStorage.getAllKeys();
  return AsyncStorage.multiGet(keys);
};

export { deleteData, getAllData, getData, storeData };
