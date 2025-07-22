import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Alert,
  AlertButton,
  Modal,
  Text,
  View,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Image,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import {
  useChatContext,
  useMessageComposer,
  useTheme,
  useTranslationContext,
} from 'stream-chat-expo';
import MapView, { MapMarker, Marker } from 'react-native-maps';

type LiveLocationCreateModalProps = {
  visible: boolean;
  onRequestClose: () => void;
};

const endedAtDurations = [60000, 600000, 3600000]; // 1 min, 10 mins, 1 hour

export const LiveLocationCreateModal = ({
  visible,
  onRequestClose,
}: LiveLocationCreateModalProps) => {
  const [location, setLocation] = useState<Location.LocationObjectCoords>();
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

  const aspect_ratio = width / height;

  const region = useMemo(() => {
    const latitudeDelta = 0.1;
    const longitudeDelta = latitudeDelta * aspect_ratio;
    if (location) {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta,
        longitudeDelta,
      };
    }
  }, [aspect_ratio, location]);

  useEffect(() => {
    let subscription: Location.LocationSubscription;
    const watchLocationHandler = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissions not granted!');
        return;
      }
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 0,
          // Android only: these option are ignored on iOS
          timeInterval: 2000,
        },
        (position) => {
          setLocation(position.coords);
          const newPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1 * aspect_ratio,
          };
          if (mapRef.current?.animateToRegion) {
            mapRef.current.animateToRegion(newPosition, 500);
          }
          // This is android only
          if (Platform.OS === 'android' && markerRef.current?.animateMarkerToCoordinate) {
            markerRef.current.animateMarkerToCoordinate(newPosition, 500);
          }
        },
        (error) => {
          console.error('watchPosition', error);
        },
      );
    };
    watchLocationHandler();
    return () => {
      subscription?.remove();
    };
  }, []);

  const buttons = [
    {
      text: 'Share Live Location',
      description: 'Share your location in real-time',
      onPress: () => {
        const options: AlertButton[] = endedAtDurations.map((offsetMs) => ({
          text: t('timestamp/Location end at', { milliseconds: offsetMs }),
          onPress: async () => {
            await messageComposer.locationComposer.setData({
              durationMs: offsetMs,
              latitude: location?.latitude,
              longitude: location?.longitude,
            });
            await messageComposer.sendLocation();
            onRequestClose();
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
        onRequestClose();
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission to access location was denied!');
          return;
        }
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          distanceInterval: 0,
        });

        if (location) {
          await messageComposer.locationComposer.setData({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          await messageComposer.sendLocation();
        }
      },
    },
  ];

  if (!location && client) {
    return null;
  }

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

      <MapView
        cameraZoomRange={{ maxCenterCoordinateDistance: 3000 }}
        initialRegion={region}
        ref={mapRef}
        style={styles.mapView}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            ref={markerRef}
            title='Your Location'
            description='This is your current location'
          >
            <View style={styles.markerWrapper}>
              <Image
                source={{ uri: client.user?.image || '' }}
                style={[styles.markerImage, { borderColor: accent_blue }]}
              />
            </View>
          </Marker>
        )}
      </MapView>
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
