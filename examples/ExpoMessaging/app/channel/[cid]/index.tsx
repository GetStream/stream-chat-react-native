import React, { useCallback, useContext, useEffect, useState } from 'react';

import { Pressable, StyleSheet, View } from 'react-native';

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import type { Channel as StreamChatChannel } from 'stream-chat';
import {
  Channel,
  ChannelAvatar,
  MessageComposer,
  MessageList,
  ThreadContextValue,
  useChannelPreviewDisplayName,
  useChatContext,
} from 'stream-chat-expo';

import { AuthProgressLoader } from '../../../components/AuthProgressLoader';
import { AppContext } from '../../../context/AppContext';

export default function ChannelScreen() {
  const { client } = useChatContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  const navigateThroughPushNotification = params.push_notification as string;
  const channelId = params.cid as string;
  const messageId = params.messageId as string | undefined;
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
  const displayName = useChannelPreviewDisplayName(channel);

  const onOpenDetails = useCallback(() => {
    if (!channel?.cid) return;
    router.push(`/channel/${channel.cid}/details`);
  }, [channel?.cid, router]);

  if (!channel) {
    return <AuthProgressLoader />;
  }

  const onPressMessage: NonNullable<React.ComponentProps<typeof Channel>['onPressMessage']> = (
    payload,
  ) => {
    const { message, defaultHandler, emitter } = payload;
    const shared_location = message?.shared_location;
    if (emitter === 'messageContent' && message && shared_location) {
      // Create url params from shared_location
      const params = Object.entries(shared_location)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      router.push(`/map/${message?.id}?${params}`);
    }
    defaultHandler?.();
  };

  if (!channel) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: displayName || 'Channel',
          contentStyle: { backgroundColor: 'white' },
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => (
            <Pressable
              accessibilityLabel='Channel details'
              accessibilityRole='button'
              onPress={onOpenDetails}
              style={({ pressed }) => ({
                alignItems: 'center',
                height: 40,
                justifyContent: 'center',
                opacity: pressed ? 0.5 : 1,
                width: 40,
              })}
            >
              <ChannelAvatar channel={channel} size='lg' />
            </Pressable>
          ),
        }}
      />
      <Channel
        audioRecordingEnabled={true}
        channel={channel}
        onPressMessage={onPressMessage}
        keyboardVerticalOffset={headerHeight}
        topInset={headerHeight}
        thread={thread}
        messageId={messageId}
      >
        <MessageList
          onThreadSelect={(thread: ThreadContextValue['thread']) => {
            setThread(thread);
            router.push(`/channel/${channel.cid}/thread/${thread?.cid ?? ''}`);
          }}
        />
        <MessageComposer />
      </Channel>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
