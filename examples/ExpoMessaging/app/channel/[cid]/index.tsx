import React, { useContext } from 'react';
import { SafeAreaView, View } from 'react-native';
import { Channel, MessageInput, MessageList } from 'stream-chat-expo';
import { Stack, useRouter } from 'expo-router';
import { AuthProgressLoader } from '../../../components/AuthProgressLoader';
import { AppContext } from '../../../context/AppContext';
import { useHeaderHeight } from '@react-navigation/elements';
import InputButtons from '../../../components/InputButtons';
import { MessageLocation } from '../../../components/LocationSharing/MessageLocation';

export default function ChannelScreen() {
  const router = useRouter();
  const { setThread, channel, thread } = useContext(AppContext);
  const headerHeight = useHeaderHeight();

  if (!channel) {
    return <AuthProgressLoader />;
  }

  const onPressMessage: NonNullable<React.ComponentProps<typeof Channel>['onPressMessage']> = (
    payload,
  ) => {
    const { message, defaultHandler, emitter } = payload;
    const { shared_location } = message;
    if (emitter === 'messageContent' && shared_location) {
      // Create url params from shared_location
      const params = Object.entries(shared_location)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      router.push(`/map/${message.id}?${params}`);
    }
    defaultHandler?.();
  };

  return (
    <SafeAreaView>
      <Stack.Screen options={{ title: 'Channel Screen' }} />
      {channel && (
        <Channel
          audioRecordingEnabled={true}
          channel={channel}
          onPressMessage={onPressMessage}
          keyboardVerticalOffset={headerHeight}
          MessageLocation={MessageLocation}
          thread={thread}
        >
          <View style={{ flex: 1 }}>
            <MessageList
              onThreadSelect={(thread) => {
                setThread(thread);
                router.push(`/channel/${channel.cid}/thread/${thread.cid}`);
              }}
            />
            <MessageInput InputButtons={InputButtons} />
          </View>
        </Channel>
      )}
    </SafeAreaView>
  );
}
