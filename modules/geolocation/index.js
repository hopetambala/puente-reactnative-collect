import * as Location from "expo-location";

export default async function getLocation() {
  if (process.env.EXPO_PUBLIC_TEST_MODE === "true") return null;

  const { status } = await Location.requestForegroundPermissionsAsync().catch(
    (err) => console.log(err) //eslint-disable-line
  );

  if (status !== "granted") {
    throw new Error("Puente was denied access to phone geolocation");
  }

  const currentLocation = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  }).catch((err) => console.log(err)); //eslint-disable-line

  return currentLocation;
}
