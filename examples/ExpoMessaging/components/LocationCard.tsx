import React, { useMemo } from 'react';
import { Button, Platform, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import { Channel, Card as DefaultCard, useMessageContext, useTheme } from 'stream-chat-expo';
import { useLiveLocationContext } from '../context/LiveLocationContext';

const MapCard = ({
  latitude,
  longitude,
  ended_at,
}: {
  latitude: number;
  longitude: number;
  ended_at?: string;
}) => {
  const { width, height } = useWindowDimensions();
  const aspect_ratio = width / height;
  const { stopLiveLocation } = useLiveLocationContext();
  const {
    theme: {
      colors: { accent_blue },
    },
  } = useTheme();

  const { isMyMessage, message } = useMessageContext();
  const showStopSharingButton = !ended_at && isMyMessage;

  // Convert ISO date string to Date object
  const endedAtDate = ended_at ? new Date(ended_at) : null;

  // Format the date to a readable string
  const formattedEndedAt = endedAtDate ? endedAtDate.toLocaleString() : '';

  // this is to compute the zoom level and centre for the map view
  const region = useMemo(() => {
    return {
      latitude,
      longitude,
    };
  }, [aspect_ratio, latitude, longitude]);

  const onStopLocationSharing = async () => {
    await stopLiveLocation(message.id);
  };

  if (Platform.OS === 'ios') {
    return (
      <>
        <AppleMaps.View
          style={styles.mapView}
          cameraPosition={{ coordinates: region, zoom: 16 }}
          markers={[{ coordinates: region, tintColor: accent_blue }]}
          properties={{ selectionEnabled: false }}
          uiSettings={{ myLocationButtonEnabled: false, togglePitchEnabled: false }}
        />
        {showStopSharingButton && <Button title='Stop sharing' onPress={onStopLocationSharing} />}
        {ended_at && <Text style={styles.textStyle}>Ended at: {formattedEndedAt}</Text>}
        {!ended_at && !showStopSharingButton && <Button title={'Live location'} disabled={true} />}
      </>
    );
  } else if (Platform.OS === 'android') {
    return (
      <>
        <GoogleMaps.View
          style={styles.mapView}
          cameraPosition={{ coordinates: region, zoom: 16 }}
          markers={[{ coordinates: region }]}
          properties={{ selectionEnabled: false }}
          uiSettings={{
            myLocationButtonEnabled: false,
            togglePitchEnabled: false,
            zoomControlsEnabled: false,
          }}
          userLocation={{ coordinates: region, followUserLocation: false }}
        />
        {showStopSharingButton && <Button title='Stop sharing' onPress={onStopLocationSharing} />}
        {ended_at && <Text style={styles.textStyle}>Ended at: {formattedEndedAt}</Text>}
        {!ended_at && !showStopSharingButton && <Button title={'Live location'} disabled={true} />}
      </>
    );
  }
};

export const LocationCard: NonNullable<React.ComponentProps<typeof Channel>['Card']> = React.memo(
  (props) => {
    const { type, ...otherProperties } = props;

    if (type === 'location') {
      // @ts-ignore
      return <MapCard {...otherProperties} />;
    }

    return <DefaultCard {...props} />;
  },
  (prevAttachment, nextAttachment) => {
    return (
      prevAttachment.latitude === nextAttachment.latitude &&
      prevAttachment.longitude === nextAttachment.longitude &&
      prevAttachment.ended_at === nextAttachment.ended_at
    );
  },
);

export const isAttachmentEqualHandler = (prevAttachment, nextAttachment) => {
  if (prevAttachment.type === 'location' && nextAttachment.type === 'location') {
    return (
      prevAttachment.latitude === nextAttachment.latitude &&
      prevAttachment.longitude === nextAttachment.longitude &&
      prevAttachment.ended_at === nextAttachment.ended_at
    );
  }
  return true;
};

const styles = StyleSheet.create({
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
});
