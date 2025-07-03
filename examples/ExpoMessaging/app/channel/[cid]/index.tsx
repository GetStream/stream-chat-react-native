import React, { useContext, useRef, useEffect } from 'react';
import { SafeAreaView, View } from 'react-native';
import {
  AITypingIndicatorView,
  Channel,
  MessageInput,
  MessageList,
  StreamingMessageView,
} from 'stream-chat-expo';
import { Stack, useRouter } from 'expo-router';
import { AuthProgressLoader } from '../../../components/AuthProgressLoader';
import { AppContext } from '../../../context/AppContext';
import { useHeaderHeight } from '@react-navigation/elements';
import { ControlAIButton } from '../../../components/ControlAIButton';
import { MyStopGenerationButton } from '../../../components/StopAIGeneration';

const MyStreamingMessageView = (props) => (
  <View style={{ padding: 10 }}>
    <StreamingMessageView {...props} />
  </View>
);

const AIMessageList = () => {
  const router = useRouter();
  const { setThread, channel } = useContext(AppContext);
  const flatListRef = useRef(null);

  return (
    <MessageList
      additionalFlatListProps={{
        maintainVisibleContentPosition: {
          autoscrollToTopThreshold: 0,
          minIndexForVisible: 0,
        },
      }}
      onThreadSelect={(thread) => {
        setThread(thread);
        router.push(`/channel/${channel.cid}/thread/${thread.cid}`);
      }}
      setFlatListRef={(ref) => (flatListRef.current = ref)}
    />
  );
};

export default function ChannelScreen() {
  const { channel } = useContext(AppContext);
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
          StreamingMessageView={MyStreamingMessageView}
          initialScrollToFirstUnreadMessage
        >
          <View style={{ flex: 1 }}>
            <MyStopGenerationButton channel={channel} />
            <AIMessageList />
            <ControlAIButton channel={channel} />
            <AITypingIndicatorView />
            <MessageInput />
          </View>
        </Channel>
      )}
    </SafeAreaView>
  );
}
