import React, { useContext } from 'react';
import { Platform } from 'react-native';

import { useHeaderHeight } from '@react-navigation/elements';
import { Stack } from 'expo-router';
import { Channel, Thread } from 'stream-chat-expo';

import { AppContext } from '../../../../../context/AppContext';

export default function ThreadScreen() {
  const { channel, thread, setThread } = useContext(AppContext);
  const headerHeight = useHeaderHeight();

  if (!channel) {
    return null;
  }

  return (
    <Channel
      audioRecordingEnabled={true}
      channel={channel}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : undefined}
      topInset={headerHeight}
      thread={thread}
      threadList
    >
      <Stack.Screen options={{ title: 'Thread Screen' }} />

      <Thread
        onThreadDismount={() => {
          setThread(undefined);
        }}
      />
    </Channel>
  );
}
