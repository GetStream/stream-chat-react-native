import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  AlertButton,
  Linking,
  Modal,
  PermissionsAndroid,
  Text,
  View,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Image,
  Platform,
} from 'react-native';
import Geolocation, {
  GeolocationError,
  GeolocationResponse,
} from '@react-native-community/geolocation';
import {
  useChatContext,
  useMessageComposer,
  useTheme,
  useTranslationContext,
} from 'stream-chat-react-native';
import MapView, { MapMarker, Marker } from 'react-native-maps';

type LiveLocationCreateModalProps = {
  visible: boolean;
  onRequestClose: () => void;
};

const endedAtDurations = [60000, 600000, 3600000]; // 1 min, 10 mins, 1 hour
const LOCATION_PERMISSION_ERROR = 'Location permission is required.';
const LOCATION_SETTINGS_ERROR = 'Location permission is blocked. Enable it in Settings.';

export const LiveLocationCreateModal = ({
  visible,
  onRequestClose,
}: LiveLocationCreateModalProps) => {
  const [location, setLocation] = useState<GeolocationResponse>();
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermissionIssue, setLocationPermissionIssue] = useState(false);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [locationSetupAttempt, setLocationSetupAttempt] = useState(0);
  const messageComposer = useMessageComposer();
  const { width, height } = useWindowDimensions();
  const { client } = useChatContext();
  const {
    theme: {
      colors: { accent_blue, grey, grey_whisper },
    },
  } = useTheme();
  const { t } = useTranslationContext();
  const mapRef = useRef<MapView | null>(null);
  const markerRef = useRef<MapMarker | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const aspect_ratio = width / height;

  const region = useMemo(() => {
    const latitudeDelta = 0.1;
    const longitudeDelta = latitudeDelta * aspect_ratio;
    if (location) {
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta,
        longitudeDelta,
      };
    }
  }, [aspect_ratio, location]);

  const ensureAndroidLocationPermission = async (): Promise<{
    blocked: boolean;
    granted: boolean;
  }> => {
    if (Platform.OS !== 'android') {
      return { blocked: false, granted: true };
    }

    const finePermission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
    const coarsePermission = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;
    const [hasFinePermission, hasCoarsePermission] = await Promise.all([
      PermissionsAndroid.check(finePermission),
      PermissionsAndroid.check(coarsePermission),
    ]);

    if (hasFinePermission || hasCoarsePermission) {
      setPermissionBlocked(false);
      return { blocked: false, granted: true };
    }

    const result = await PermissionsAndroid.requestMultiple([finePermission, coarsePermission]);
    const fineResult = result[finePermission];
    const coarseResult = result[coarsePermission];
    const granted =
      fineResult === PermissionsAndroid.RESULTS.GRANTED ||
      coarseResult === PermissionsAndroid.RESULTS.GRANTED;

    if (granted) {
      setPermissionBlocked(false);
      return { blocked: false, granted: true };
    }

    const blocked =
      fineResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
      coarseResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;
    setPermissionBlocked(blocked);
    return { blocked, granted: false };
  };

  const isPermissionError = (error: GeolocationError) =>
    error.code === error.PERMISSION_DENIED || error.code === 1;

  const retryLocationSetup = () => {
    setLocation(undefined);
    setPermissionBlocked(false);
    setLocationPermissionIssue(false);
    setLocationError(null);
    setLocationSetupAttempt((current) => current + 1);
  };

  const openSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('openSettings', error);
    }
  };

  useEffect(() => {
    if (!visible) {
      return;
    }

    let isMounted = true;
    const startWatchingLocation = () => {
      setLocationError(null);
      setLocationPermissionIssue(false);

      watchIdRef.current = Geolocation.watchPosition(
        (position) => {
          setLocation(position);
          const newPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1 * aspect_ratio,
          };
          if (mapRef.current?.animateToRegion) {
            mapRef.current.animateToRegion(newPosition, 500);
          }
          if (Platform.OS === 'android' && markerRef.current?.animateMarkerToCoordinate) {
            markerRef.current.animateMarkerToCoordinate(newPosition, 500);
          }
        },
        (error) => {
          if (!isMounted) {
            return;
          }
          setLocationPermissionIssue(isPermissionError(error));
          setLocationError(error.message || 'Unable to fetch your current location.');
          console.error('watchPosition', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 1000,
          interval: 2000, // android only
        },
      );
    };

    const watchLocationHandler = async () => {
      const { blocked, granted } = await ensureAndroidLocationPermission();
      if (!granted) {
        if (isMounted) {
          setLocationPermissionIssue(true);
          setLocationError(blocked ? LOCATION_SETTINGS_ERROR : LOCATION_PERMISSION_ERROR);
        }
        return;
      }

      if (Platform.OS === 'android') {
        startWatchingLocation();
        return;
      }

      Geolocation.requestAuthorization(undefined, (error) => {
        if (!isMounted) {
          return;
        }
        setLocationPermissionIssue(isPermissionError(error));
        setLocationError(error.message || 'Location permission is required.');
        console.error('requestAuthorization', error);
      });
      startWatchingLocation();
    };
    watchLocationHandler();
    return () => {
      isMounted = false;
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [aspect_ratio, locationSetupAttempt, visible]);

  const buttons = [
    {
      text: 'Share Live Location',
      description: 'Share your location in real-time',
      onPress: () => {
        const options: AlertButton[] = endedAtDurations.map((offsetMs) => ({
          text: t('duration/Location end at', { milliseconds: offsetMs }),
          onPress: async () => {
            if (location) {
              await messageComposer.locationComposer.setData({
                durationMs: offsetMs,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
              await messageComposer.sendLocation();
              onRequestClose();
            }
          },
          style: 'default',
        }));

        options.push({ style: 'destructive', text: 'Cancel' });

        Alert.alert(
          'Share Live Location',
          'Select the duration for which you want to share your live location.',
          options,
        );
      },
    },
    {
      text: 'Share Current Location',
      description: 'Share your current location once',
      onPress: async () => {
        const { blocked, granted } = await ensureAndroidLocationPermission();
        if (!granted) {
          setLocationPermissionIssue(true);
          setLocationError(blocked ? LOCATION_SETTINGS_ERROR : LOCATION_PERMISSION_ERROR);
          return;
        }

        setLocationPermissionIssue(false);
        Geolocation.getCurrentPosition(
          async (position) => {
            if (position.coords) {
              await messageComposer.locationComposer.setData({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
              await messageComposer.sendLocation();
              onRequestClose();
            }
          },
          (error) => {
            setLocationPermissionIssue(isPermissionError(error));
            setLocationError(error.message || 'Unable to fetch your current location.');
          },
        );
      },
    },
  ];

  return (
    <Modal
      animationType='slide'
      visible={visible}
      onRequestClose={onRequestClose}
      presentationStyle='formSheet'
    >
      <View style={styles.modalHeader}>
        <Pressable onPress={onRequestClose} style={styles.leftContent}>
          <Text style={[styles.cancelText, { color: accent_blue }]}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Share Location</Text>
        <View style={styles.rightContent} />
      </View>

      {location && region ? (
        <MapView
          cameraZoomRange={{ maxCenterCoordinateDistance: 2000 }}
          initialRegion={region}
          ref={mapRef}
          style={styles.mapView}
        >
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            ref={markerRef}
            title='Your Location'
            description='This is your current location'
          >
            <View style={styles.markerWrapper}>
              <Image
                source={{ uri: client?.user?.image || '' }}
                style={[styles.markerImage, { borderColor: accent_blue }]}
              />
            </View>
          </Marker>
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={accent_blue} />
          <Text style={[styles.loadingText, { color: grey }]}>
            {locationError || t('Fetching your current location...')}
          </Text>
          {permissionBlocked ? (
            <Pressable
              onPress={openSettings}
              style={({ pressed }) => [
                styles.settingsButton,
                { borderColor: pressed ? accent_blue : grey_whisper },
              ]}
            >
              <Text style={[styles.settingsButtonText, { color: accent_blue }]}>
                {t('Open Settings')}
              </Text>
            </Pressable>
          ) : locationPermissionIssue && Platform.OS === 'android' ? (
            <Pressable
              onPress={retryLocationSetup}
              style={({ pressed }) => [
                styles.settingsButton,
                { borderColor: pressed ? accent_blue : grey_whisper },
              ]}
            >
              <Text style={[styles.settingsButtonText, { color: accent_blue }]}>
                {t('Allow Location')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
      <View style={styles.buttons}>
        {buttons.map((button, index) => (
          <Pressable
            key={index}
            onPress={button.onPress}
            style={({ pressed }) => [
              {
                borderColor: pressed ? accent_blue : grey_whisper,
              },
              styles.button,
            ]}
          >
            <Text style={[styles.buttonTitle, { color: accent_blue }]}>{button.text}</Text>
            <Text style={[styles.buttonDescription, { color: grey }]}>{button.description}</Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
};

const IMAGE_SIZE = 35;

const styles = StyleSheet.create({
  mapView: {
    width: 'auto',
    flex: 3,
  },
  loadingContainer: {
    flex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  settingsButton: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  textStyle: {
    fontSize: 12,
    color: 'gray',
    marginHorizontal: 12,
    marginVertical: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  cancelText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  rightContent: {
    flex: 1,
    flexShrink: 1,
  },
  leftContent: {
    flex: 1,
    flexShrink: 1,
  },
  buttons: {
    flex: 1,
    marginVertical: 16,
  },
  button: {
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 4,
    marginHorizontal: 16,
    padding: 8,
  },
  buttonTitle: {
    fontWeight: '600',
    marginVertical: 4,
  },
  buttonDescription: {
    fontSize: 12,
    marginVertical: 4,
  },
  markerWrapper: {
    overflow: 'hidden', // REQUIRED for rounded corners to show on Android
  },
  markerImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    resizeMode: 'cover', // or 'contain' if image is cropped
    borderWidth: 2,
  },
});
