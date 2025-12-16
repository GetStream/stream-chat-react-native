import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme, ThreadList } from 'stream-chat-expo';

import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { AppContext } from '@/context/AppContext';

export default function ThreadsScreen() {
  const {
    theme: {
      colors: { white_snow },
    },
  } = useTheme();
  const isFocused = useIsFocused();
  const router = useRouter();
  const { setThread, setChannel } = useContext(AppContext);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: white_snow,
        },
      ]}
    >
      <ThreadList
        isFocused={isFocused}
        onThreadSelect={(thread, channel) => {
          setChannel(channel);
          setThread(thread.thread);
          router.push(`/channel/${channel.cid}/thread/${thread.thread.id}`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyIndicatorContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyIndicatorText: {
    fontSize: 14,
    paddingTop: 28,
  },
});
