import React, { useContext } from 'react';
import { SafeAreaView, View } from 'react-native';
import { Channel, MessageInput, MessageList } from 'stream-chat-expo';
import { Stack, useRouter } from 'expo-router';
import { AuthProgressLoader } from '../../../components/AuthProgressLoader';
import { AppContext } from '../../../context/AppContext';
import { useHeaderHeight } from '@react-navigation/elements';

export default function ChannelScreen() {
  const router = useRouter();
  const { setThread, channel } = useContext(AppContext);
  const headerHeight = useHeaderHeight();

  if (!channel) {
    return <AuthProgressLoader />;
  }

  return (
    <SafeAreaView>
      <Stack.Screen options={{ title: 'Channel Screen' }} />
      {channel && (
        <Channel
          audioRecordingEnabled={true}
          channel={channel}
          keyboardVerticalOffset={headerHeight}
        >
          <View style={{ flex: 1 }}>
            <MessageList
              onThreadSelect={(thread) => {
                setThread(thread);
                router.push(`/channel/${channel.cid}/thread/${thread.cid}`);
              }}
            />
            <MessageInput />
          </View>
        </Channel>
      )}
    </SafeAreaView>
  );
}
