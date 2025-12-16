import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  Platform,
  Pressable,
  useWindowDimensions,
  StyleSheet,
  View,
  Image,
  Text,
} from 'react-native';
import { useContext, useMemo, useCallback, useRef } from 'react';
import { AppContext } from '../../context/AppContext';
import { useChatContext, useHandleLiveLocationEvents, useTheme } from 'stream-chat-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { MapMarker, Marker } from 'react-native-maps';
import { SharedLocationResponse, StreamChat } from 'stream-chat';

export type SharedLiveLocationParamsStringType = SharedLocationResponse & {
  latitude: string;
  longitude: string;
};

const MapScreenFooter = ({
  client,
  shared_location,
  locationResponse,
  isLiveLocationStopped,
}: {
  client: StreamChat;
  shared_location: SharedLocationResponse;
  locationResponse?: SharedLocationResponse;
  isLiveLocationStopped?: boolean;
}) => {
  const { channel } = useContext(AppContext);
  const { end_at, user_id } = shared_location;
  const {
    theme: {
      colors: { accent_blue, accent_red, grey },
    },
  } = useTheme();
  const liveLocationActive = isLiveLocationStopped
    ? false
    : end_at && new Date(end_at) > new Date();
  const endedAtDate = end_at ? new Date(end_at) : null;
  const formattedEndedAt = endedAtDate ? endedAtDate.toLocaleString() : '';

  const stopSharingLiveLocation = useCallback(async () => {
    if (!locationResponse) {
      return;
    }
    await channel?.stopLiveLocationSharing(locationResponse);
  }, [channel, locationResponse]);

  if (!end_at) {
    return null;
  }

  const isCurrentUser = user_id === client.user?.id;
  if (!isCurrentUser) {
    return (
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: liveLocationActive ? accent_blue : accent_red }]}>
          {liveLocationActive ? 'Live Location' : 'Live Location ended'}
        </Text>
        <Text style={[styles.footerDescription, { color: grey }]}>
          {liveLocationActive
            ? `Live until: ${formattedEndedAt}`
            : `Location last updated at: ${formattedEndedAt}`}
        </Text>
      </View>
    );
  }

  if (liveLocationActive) {
    return (
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.footerButton, { opacity: pressed ? 0.5 : 1 }]}
          onPress={stopSharingLiveLocation}
          hitSlop={10}
        >
          <Text style={[styles.footerText, { color: accent_red }]}>Stop Sharing</Text>
        </Pressable>

        <Text style={[styles.footerDescription, { color: grey }]}>
          Live until: {formattedEndedAt}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.footer}>
      <Text style={[styles.footerText, { color: accent_red }]}>Live Location ended</Text>
      <Text style={[styles.footerDescription, { color: grey }]}>
        Location last updated at: {formattedEndedAt}
      </Text>
    </View>
  );
};

export default function MapScreen() {
  const { client } = useChatContext();
  const shared_location = useLocalSearchParams<SharedLiveLocationParamsStringType>();
  const { channel } = useContext(AppContext);
  const mapRef = useRef<MapView | null>(null);
  const markerRef = useRef<MapMarker | null>(null);
  const {
    theme: {
      colors: { accent_blue },
    },
  } = useTheme();

  const { width, height } = useWindowDimensions();
  const aspect_ratio = width / height;

  const onLocationUpdate = useCallback((location: SharedLocationResponse) => {
    const newPosition = {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1 * aspect_ratio,
    };
    // Animate the map to the new position
    if (mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion(newPosition, 500);
    }
    // This is android only
    if (Platform.OS === 'android' && markerRef.current?.animateMarkerToCoordinate) {
      markerRef.current.animateMarkerToCoordinate(newPosition, 500);
    }
  }, []);

  const { isLiveLocationStopped, locationResponse } = useHandleLiveLocationEvents({
    channel,
    messageId: shared_location.message_id,
    onLocationUpdate,
  });

  const initialRegion = useMemo(() => {
    const latitudeDelta = 0.1;
    const longitudeDelta = latitudeDelta * aspect_ratio;

    return {
      latitude: parseFloat(shared_location.latitude),
      longitude: parseFloat(shared_location.longitude),
      latitudeDelta,
      longitudeDelta,
    };
  }, [aspect_ratio]);

  const region = useMemo(() => {
    const latitudeDelta = 0.1;
    const longitudeDelta = latitudeDelta * aspect_ratio;
    return {
      latitude: locationResponse?.latitude,
      longitude: locationResponse?.longitude,
      latitudeDelta,
      longitudeDelta,
    };
  }, [aspect_ratio, locationResponse]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Map Screen' }} />
      <MapView
        cameraZoomRange={{ maxCenterCoordinateDistance: 3000 }}
        initialRegion={initialRegion}
        ref={mapRef}
        style={styles.mapView}
      >
        {shared_location.end_at ? (
          <Marker
            coordinate={
              !locationResponse
                ? { latitude: initialRegion.latitude, longitude: initialRegion.longitude }
                : { latitude: region.latitude, longitude: region.longitude }
            }
            ref={markerRef}
          >
            <View style={styles.markerWrapper}>
              <Image
                style={[styles.markerImage, { borderColor: accent_blue }]}
                source={{ uri: client.user?.image }}
              />
            </View>
          </Marker>
        ) : (
          <Marker coordinate={initialRegion} ref={markerRef} pinColor={accent_blue} />
        )}
      </MapView>
      <MapScreenFooter
        client={client}
        shared_location={shared_location}
        locationResponse={locationResponse}
        isLiveLocationStopped={isLiveLocationStopped}
      />
    </SafeAreaView>
  );
}

const IMAGE_SIZE = 35;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapView: {
    width: 'auto',
    flex: 3,
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
  footer: {
    marginVertical: 8,
  },
  footerButton: {
    padding: 4,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 14,
  },
  footerDescription: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 4,
  },
});
