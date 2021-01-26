import * as Location from 'expo-location';

export default async function getLocation() {
  const { status } = await Location.requestPermissionsAsync().catch((err) => console.log(err)); //eslint-disable-line
  if (status !== 'granted') {
    return 'Permission to access location was denied';
  }

  const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch((err) => console.log(err)); //eslint-disable-line

  return currentLocation;
}
