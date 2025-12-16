import React, { useContext } from 'react';
import { StyleSheet } from 'react-native';
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
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <Channel
        audioRecordingEnabled={true}
        channel={channel}
        keyboardVerticalOffset={headerHeight}
        thread={thread}
        threadList
      >
        <Stack.Screen options={{ title: 'Thread Screen', headerBackTitle: 'Back' }} />

        <Thread
          onThreadDismount={() => {
            setThread(undefined);
          }}
        />
      </Channel>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
});
