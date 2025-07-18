import * as Location from 'expo-location';
import { Alert } from 'react-native';

export type LocationHandler = (value: { latitude: number; longitude: number }) => void;

export const checkLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.warn('Location permission not granted');
    Alert.alert('Location permission not granted!');
    return false;
  }
  return true;
};

export const watchLocation = (handler: LocationHandler) => {
  let subscription: Location.LocationSubscription | null = null;
  Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      distanceInterval: 0,
      // Android only: these option are ignored on iOS
      timeInterval: 2000,
    },
    (location) => {
      const { latitude, longitude } = location.coords;
      handler({ latitude, longitude });
    },
    (error) => {
      console.warn('Error watching location:', error);
    },
  ).then((sub) => {
    subscription = sub;
  });

  return () => {
    subscription?.remove();
  };
};
