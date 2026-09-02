import { useContext, useMemo, useCallback, useRef } from 'react';
import {
  Platform,
  Pressable,
  useWindowDimensions,
  StyleSheet,
  View,
  Image,
  Text,
} from 'react-native';

import MapView, { MapMarker, Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Stack, useLocalSearchParams } from 'expo-router';
import {
  Channel,
  convertTimestampToDate,
  nowNs,
  SharedLocationResponse,
  StreamChat,
} from 'stream-chat';
import { useChatContext, useHandleLiveLocationEvents, useTheme } from 'stream-chat-expo';

import { AppContext } from '../../context/AppContext';

import type { AppTheme } from '@/types/theme';

/**
 * Route params, which expo-router delivers as **strings** — the pressing screen stringifies every
 * field of the shared location into the URL.
 *
 * Declared independently of `SharedLocationResponse` rather than intersected with it. Since v10 that
 * type's date fields are unix-nanosecond `number`s, which both violate `useLocalSearchParams`' string
 * constraint and misdescribe what actually arrives — `end_at` reaching `convertTimestampToDate` as a
 * string made `Number.isFinite` false, so the "ended at" label silently rendered empty.
 */
export type SharedLiveLocationParamsStringType = {
  channel_cid: string;
  created_at: string;
  created_by_device_id: string;
  end_at?: string;
  latitude: string;
  longitude: string;
  message_id: string;
  updated_at: string;
  user_id: string;
};

const MapScreenFooter = ({
  client,
  shared_location,
  locationResponse,
  isLiveLocationStopped,
}: {
  client: StreamChat;
  shared_location: SharedLiveLocationParamsStringType;
  locationResponse?: SharedLocationResponse;
  isLiveLocationStopped?: boolean;
}) => {
  const { channel } = useContext(AppContext);
  const { end_at, user_id } = shared_location;
  const {
    theme: {
      colors: { accent_blue, accent_red, grey },
    },
  } = useTheme() as unknown as { theme: AppTheme };
  // `end_at` arrives as a route-param string holding a unix-**nanosecond** timestamp, so it is
  // parsed back to a number before any comparison: `new Date(ns)` is out of range, and
  // `convertTimestampToDate` rejects a string outright (`Number.isFinite('1788…')` is false).
  const endAt = end_at != null ? Number(end_at) : undefined;
  const liveLocationActive =
    !isLiveLocationStopped && endAt !== undefined && Number.isFinite(endAt) && endAt > nowNs();
  const formattedEndedAt = convertTimestampToDate(endAt)?.toLocaleString() ?? '';

  const stopSharingLiveLocation = useCallback(async () => {
    if (!channel || !locationResponse) {
      return;
    }
    // The request shape, not the response: `stopLiveLocationSharing` stamps `end_at` itself, and
    // the response's `end_at` is a wire number the request field cannot take.
    await channel.stopLiveLocationSharing({ message_id: locationResponse.message_id });
  }, [channel, locationResponse]);

  if (end_at == null) {
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
  } = useTheme() as unknown as { theme: AppTheme };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- example app: deps treated as stable per mount; revisit if they become dynamic
  }, []);

  const { isLiveLocationStopped, locationResponse } = useHandleLiveLocationEvents({
    // This screen is only reached by navigating from an open channel (which sets `channel`
    // in AppContext), so a channel is always present here even though the context type
    // allows `undefined`.
    channel: channel as Channel,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- example app: deps treated as stable per mount; revisit if they become dynamic
  }, [aspect_ratio]);

  const region = useMemo(() => {
    const latitudeDelta = 0.1;
    const longitudeDelta = latitudeDelta * aspect_ratio;
    // Fall back to the initial coordinates parsed from the route params when no live
    // location update has arrived yet, so the values are always concrete numbers.
    return {
      latitude: locationResponse?.latitude ?? parseFloat(shared_location.latitude),
      longitude: locationResponse?.longitude ?? parseFloat(shared_location.longitude),
      latitudeDelta,
      longitudeDelta,
    };
  }, [aspect_ratio, locationResponse, shared_location.latitude, shared_location.longitude]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Map Screen' }} />
      <MapView
        cameraZoomRange={{ maxCenterCoordinateDistance: 3000 }}
        initialRegion={initialRegion}
        ref={mapRef}
        style={styles.mapView}
      >
        {shared_location.end_at != null ? (
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
        isLiveLocationStopped={isLiveLocationStopped ?? undefined}
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
