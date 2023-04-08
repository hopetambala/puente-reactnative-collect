import selectedENV from "@app/environment";
import * as Location from "expo-location";

export default async function getLocation() {
  const { TEST_MODE } = selectedENV;
  if (TEST_MODE === true) return null;

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
