import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Platform,
  Image,
  StyleSheet,
  useWindowDimensions,
  Text,
  View,
  Pressable,
} from 'react-native';

import MapView, { MapMarker, Marker } from 'react-native-maps';

import { convertTimestampToDate, nowNs, SharedLocationResponse, StreamChat } from 'stream-chat';
import {
  MessageLocationProps,
  useChannelContext,
  useChatContext,
  useTheme,
} from 'stream-chat-react-native';

import { useLegacyColors } from '../../theme/useLegacyColors';

const MessageLocationFooter = ({
  client,
  shared_location,
}: {
  client: StreamChat;
  shared_location: SharedLocationResponse;
}) => {
  const { channel } = useChannelContext();
  const { end_at, user_id } = shared_location;
  useTheme();
  const { grey } = useLegacyColors();
  // `end_at` is a unix-**nanosecond** wire timestamp: `new Date(ns)` is out of range, so the
  // comparison is done in the wire unit and only the displayed value becomes a `Date`.
  const liveLocationActive = end_at != null && end_at > nowNs();
  const formattedEndedAt = convertTimestampToDate(end_at)?.toLocaleString() ?? '';

  const stopSharingLiveLocation = useCallback(async () => {
    // The request shape, not the response: `stopLiveLocationSharing` stamps `end_at` itself, and
    // the response's `end_at` is a wire number the request field cannot take.
    await channel.stopLiveLocationSharing({ message_id: shared_location.message_id });
  }, [channel, shared_location]);

  if (end_at == null) {
    return null;
  }
  const isCurrentUser = user_id === client.user?.id;
  if (!isCurrentUser) {
    return (
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: grey }]}>
          {liveLocationActive ? `Live until: ${formattedEndedAt}` : 'Live Location ended'}
        </Text>
      </View>
    );
  }

  if (liveLocationActive) {
    return (
      <Pressable style={styles.footer} onPress={stopSharingLiveLocation}>
        <Text style={[styles.footerText, { color: 'red' }]}>Stop Sharing</Text>
      </Pressable>
    );
  }
  return (
    <View style={styles.footer}>
      <Text style={[styles.footerText, { color: grey }]}>Live Location ended</Text>
    </View>
  );
};

const MessageLocationComponent = ({
  shared_location,
}: {
  shared_location: SharedLocationResponse;
}) => {
  const { client } = useChatContext();
  const { end_at, latitude, longitude } = shared_location || {};
  const mapRef = useRef<MapView | null>(null);
  const markerRef = useRef<MapMarker | null>(null);

  const { width, height } = useWindowDimensions();
  const aspect_ratio = width / height;
  useTheme();
  const { accent_blue } = useLegacyColors();

  const region = useMemo(() => {
    const latitudeDelta = 0.1;
    const longitudeDelta = latitudeDelta * aspect_ratio;
    return {
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta,
    };
  }, [aspect_ratio, latitude, longitude]);

  useEffect(() => {
    if (!region) {
      return;
    }
    const newPosition = {
      latitude,
      longitude,
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
  }, [aspect_ratio, latitude, longitude, region]);

  if (!region) {
    return null;
  }

  return (
    <View style={styles.container}>
      <MapView
        initialRegion={region}
        cameraZoomRange={{ maxCenterCoordinateDistance: 2000 }}
        ref={mapRef}
        style={styles.mapView}
      >
        {end_at != null ? (
          <Marker coordinate={region} ref={markerRef}>
            <View style={styles.markerWrapper}>
              <Image
                style={[styles.markerImage, { borderColor: accent_blue }]}
                source={{ uri: client.user?.image }}
              />
            </View>
          </Marker>
        ) : (
          <Marker coordinate={region} ref={markerRef} pinColor={accent_blue as string} />
        )}
      </MapView>
      <MessageLocationFooter client={client} shared_location={shared_location} />
    </View>
  );
};

export const MessageLocation = ({ message }: MessageLocationProps) => {
  const { shared_location } = message;

  if (!shared_location) {
    return null;
  }

  return <MessageLocationComponent shared_location={shared_location} />;
};

const IMAGE_SIZE = 35;

const styles = StyleSheet.create({
  container: {},
  mapView: {
    height: 252,
    width: 252,
    borderRadius: 12,
  },
  textStyle: {
    fontSize: 12,
    color: 'gray',
    marginHorizontal: 12,
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
  footer: {
    marginVertical: 8,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 14,
  },
  footerDescription: {
    textAlign: 'center',
    fontSize: 12,
  },
});
