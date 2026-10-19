import React, { useContext } from 'react';
import { Platform } from 'react-native';

import { Stack } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { MessageComposer, MessageList, Thread } from 'stream-chat-expo';

import { AppContext } from '../../../../../context/AppContext';

export default function ThreadScreen() {
  const { thread, setThread } = useContext(AppContext);
  const headerHeight = useHeaderHeight();

  if (!thread) {
    return null;
  }

  return (
    <Thread
      audioRecordingEnabled={true}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : undefined}
      onThreadDismount={() => {
        setThread(undefined);
      }}
      thread={thread}
      topInset={headerHeight}
    >
      <Stack.Screen options={{ title: 'Thread Screen' }} />
      <MessageList />
      <MessageComposer />
    </Thread>
  );
}
