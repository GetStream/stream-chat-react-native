import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { Channel, Thread } from 'stream-chat-expo';
import { Stack } from 'expo-router';
import { AppContext } from '../../../../../context/AppContext';
import { useHeaderHeight } from '@react-navigation/elements';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      keyboardVerticalOffset={headerHeight}
      thread={thread}
      threadList
    >
      <Stack.Screen options={{ title: 'Thread Screen' }} />

      <SafeAreaView edges={['bottom']} style={styles.container}>
        <Thread
          onThreadDismount={() => {
            setThread(undefined);
          }}
        />
      </SafeAreaView>
    </Channel>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
});
