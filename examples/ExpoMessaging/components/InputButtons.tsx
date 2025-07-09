import React from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { Channel, useChannelContext, InputButtons as DefaultInputButtons } from 'stream-chat-expo';
import * as Location from 'expo-location';
import { useLiveLocationContext } from '../context/LiveLocationContext';
import { ShareLocationIcon } from '../icons/ShareLocationIcon';

const InputButtons: NonNullable<React.ComponentProps<typeof Channel>['InputButtons']> = (props) => {
  const { channel: currentChannel } = useChannelContext();
  const { startLiveLocation } = useLiveLocationContext();

  const sendLiveLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission to access location was denied');
      return;
    }
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      distanceInterval: 0,
    });

    if (location) {
      const response = await currentChannel.sendMessage({
        attachments: [
          {
            type: 'location',
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        ],
      });
      await startLiveLocation(response.message.id);
    }
  };

  return (
    <>
      <DefaultInputButtons {...props} hasCommands={false} />
      <Pressable style={styles.liveLocationButton} onPress={sendLiveLocation}>
        <ShareLocationIcon />
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  liveLocationButton: {
    paddingLeft: 5,
  },
});

export default InputButtons;
