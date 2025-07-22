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
import {
  MessageLocationProps,
  useChannelContext,
  useChatContext,
  useTheme,
} from 'stream-chat-react-native';
import MapView, { MapMarker, Marker } from 'react-native-maps';
import { SharedLocationResponse, StreamChat } from 'stream-chat';

const MessageLocationFooter = ({
  client,
  shared_location,
}: {
  client: StreamChat;
  shared_location: SharedLocationResponse;
}) => {
  const { channel } = useChannelContext();
  const { end_at, user_id } = shared_location;
  const {
    theme: {
      colors: { grey },
    },
  } = useTheme();
  const liveLocationActive = end_at && new Date(end_at) > new Date();
  const endedAtDate = end_at ? new Date(end_at) : null;
  const formattedEndedAt = endedAtDate ? endedAtDate.toLocaleString() : '';

  const stopSharingLiveLocation = useCallback(async () => {
    await channel.stopLiveLocationSharing(shared_location);
  }, [channel, shared_location]);

  if (!end_at) {
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

  const {
    theme: {
      colors: { accent_blue },
    },
  } = useTheme();

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
        {end_at ? (
          <Marker coordinate={region} ref={markerRef}>
            <View style={styles.markerWrapper}>
              <Image
                style={[styles.markerImage, { borderColor: accent_blue }]}
                source={{ uri: client.user?.image }}
              />
            </View>
          </Marker>
        ) : (
          <Marker coordinate={region} ref={markerRef} pinColor={accent_blue} />
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
  container: {
    flex: 1,
  },
  mapView: {
    height: 250,
    width: 250,
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
