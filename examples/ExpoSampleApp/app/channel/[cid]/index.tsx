import React, { useContext, useEffect, useState } from 'react';
import type { Channel as StreamChatChannel } from 'stream-chat';
import {
  Channel,
  MessageInput,
  useChatContext,
  ThreadContextValue,
  MessageList,
} from 'stream-chat-expo';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { AppContext } from '@/context/AppContext';
import { AuthProgressLoader } from '../../../components/AuthProgressLoader';

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

  if (!channel) {
    return null;
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <Channel
        audioRecordingEnabled={true}
        channel={channel}
        keyboardVerticalOffset={headerHeight}
        thread={thread}
      >
        <Stack.Screen options={{ title: 'Channel Screen', headerBackTitle: 'Back' }} />

        <MessageList
          onThreadSelect={(thread: ThreadContextValue['thread']) => {
            setThread(thread);
            router.push(`/channel/${channel.cid}/thread/${thread?.cid ?? ''}`);
          }}
        />
        <MessageInput />
      </Channel>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
