import React, { useContext, useEffect } from 'react';
import { SafeAreaView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Channel, MessageInput, MessageList, useAttachmentPickerContext } from 'stream-chat-expo';
import { Stack, useRouter } from 'expo-router';
import { AuthProgressLoader } from '../../../components/AuthProgressLoader';
import { AppContext } from '../../../context/AppContext';
import { useHeaderHeight } from '@react-navigation/elements';

export default function ChannelScreen() {
  const router = useRouter();
  const { setThread, channel } = useContext(AppContext);
  const { setTopInset } = useAttachmentPickerContext();
  const headerHeight = useHeaderHeight();

  useEffect(() => {
    setTopInset(headerHeight);
  }, [headerHeight, setTopInset]);

  if (!channel) {
    return <AuthProgressLoader />;
  }

  return (
    <SafeAreaView>
      <Stack.Screen options={{ title: 'Channel Screen' }} />
      {channel && (
        <Channel audioRecordingEnabled={true} channel={channel}>
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
