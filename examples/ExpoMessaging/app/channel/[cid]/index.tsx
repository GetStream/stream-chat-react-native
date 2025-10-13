import React, { useContext, useEffect, useState } from 'react';
import type { Channel as StreamChatChannel } from 'stream-chat';
import { Channel, MessageInput, MessageFlashList, useChatContext } from 'stream-chat-expo';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AuthProgressLoader } from '../../../components/AuthProgressLoader';
import { AppContext } from '../../../context/AppContext';
import { useHeaderHeight } from '@react-navigation/elements';
import InputButtons from '../../../components/InputButtons';
import { MessageLocation } from '../../../components/LocationSharing/MessageLocation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

export default function ChannelScreen() {
  const { client } = useChatContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  const navigateThroughPushNotification = params.push_notification as string;
  const channelId = params.cid as string;
  const [channelFromParams, setChannelFromParams] = useState<StreamChatChannel | undefined>(
    undefined,
  );

  // Effect to fetch channel from params if channel is navigated through push notification
  useEffect(() => {
    const initChannel = async () => {
      if (navigateThroughPushNotification) {
        const channel = client?.channel('messaging', channelId);
        await channel?.watch();
        setChannelFromParams(channel);
      }
    };
    initChannel();
  }, [navigateThroughPushNotification, channelId, client]);

  const { setThread, channel: channelContext, thread } = useContext(AppContext);
  const headerHeight = useHeaderHeight();

  const channel = channelFromParams || channelContext;

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

  if (!channel) {
    return null;
  }

  return (
    <Channel
      audioRecordingEnabled={true}
      channel={channel}
      onPressMessage={onPressMessage}
      keyboardVerticalOffset={headerHeight}
      MessageLocation={MessageLocation}
      thread={thread}
    >
      <Stack.Screen options={{ title: 'Channel Screen' }} />

      <SafeAreaView edges={['bottom']} style={styles.container}>
        <MessageFlashList
          onThreadSelect={(thread) => {
            setThread(thread);
            router.push(`/channel/${channel.cid}/thread/${thread.cid}`);
          }}
        />
        <MessageInput InputButtons={InputButtons} />
      </SafeAreaView>
    </Channel>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
