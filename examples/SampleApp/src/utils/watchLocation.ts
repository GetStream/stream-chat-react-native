import GeoLocation from '@react-native-community/geolocation';

type LocationHandler = (value: { latitude: number; longitude: number }) => void;

export const watchLocation = (handler: LocationHandler) => {
  let watchId: number | null = null;
  watchId = GeoLocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      handler({ latitude, longitude });
    },
    (error) => {
      console.warn('Error watching location:', error);
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 1000,
      interval: 2000, // android only
    },
  );

  return () => {
    if (watchId) {
      GeoLocation.clearWatch(watchId);
    }
  };
};
