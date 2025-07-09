import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Button, Platform, useWindowDimensions, StyleSheet } from 'react-native';
import { useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { useLiveLocationContext } from '../../context/LiveLocationContext';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import { useTheme } from 'stream-chat-expo';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MapScreen() {
  const router = useRouter();
  const {
    id: messageId,
    latitude,
    longitude,
    ended_at,
  } = useLocalSearchParams<{
    id: string;
    latitude?: string;
    longitude?: string;
    ended_at?: string;
  }>();
  const { channel } = useContext(AppContext);
  const {
    theme: {
      colors: { accent_blue },
    },
  } = useTheme();
  if (!channel) {
    throw new Error('MapDetailScreen - Channel is not defined');
  }
  const { isWatching, stopLiveLocation } = useLiveLocationContext();
  const { width, height } = useWindowDimensions();
  const aspect_ratio = width / height;

  const showStopSharingButton = !ended_at && isWatching(messageId);

  const endedAtDate = ended_at ? new Date(ended_at) : null;
  const formattedEndedAt = endedAtDate ? endedAtDate.toLocaleString() : '';

  const region = useMemo(() => {
    return {
      latitude: latitude ? parseFloat(latitude) : 0,
      longitude: longitude ? parseFloat(longitude) : 0,
    };
  }, [aspect_ratio, latitude, longitude]);

  useEffect(() => {
    const listeners = [
      channel.on('message.updated', (event) => {
        if (
          event.message?.id === messageId &&
          event.message.attachments?.[0]?.type === 'location'
        ) {
          const attachment = event.message.attachments[0];
          console.log('Live location updated', attachment);
          if (attachment) {
            router.setParams({
              latitude: attachment.latitude,
              longitude: attachment.longitude,
              ended_at: attachment.ended_at,
            });
          }
        }
      }),
      channel.on('message.deleted', (event) => {
        if (event.message?.id === messageId) {
          Alert.alert('Message deleted', 'The live location message has been deleted');
          if (router.canGoBack()) router.back();
        }
      }),
    ];

    return () => listeners.forEach((l) => l.unsubscribe());
  }, [channel, messageId, router]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Map Screen' }} />
      {Platform.OS === 'ios' ? (
        <AppleMaps.View
          style={styles.container}
          cameraPosition={{ coordinates: region, zoom: 16 }}
          markers={[{ coordinates: region, tintColor: accent_blue }]}
        />
      ) : (
        <GoogleMaps.View
          style={styles.container}
          cameraPosition={{ coordinates: region, zoom: 16 }}
          markers={[{ coordinates: region }]}
          properties={{ isMyLocationEnabled: true, selectionEnabled: false }}
          uiSettings={{
            compassEnabled: true,
            myLocationButtonEnabled: true,
            scrollGesturesEnabledDuringRotateOrZoom: true,
          }}
        />
      )}
      {showStopSharingButton && (
        <Button
          title='Stop sharing'
          onPress={() => {
            stopLiveLocation(messageId);
          }}
        />
      )}
      {ended_at && <Button title={`Ended at: ${formattedEndedAt}`} disabled={true} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
