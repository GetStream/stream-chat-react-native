import React from 'react';
import { StyleSheet } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import type { RouteProp } from '@react-navigation/native';
import { Channel, ChannelScheduledMessages } from 'stream-chat-react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import { useAppContext } from '../context/AppContext';
import type { StackNavigatorParamList } from '../types';

export type ScheduledMessagesScreenProps = {
  route: RouteProp<StackNavigatorParamList, 'ScheduledMessagesScreen'>;
};

/**
 * A channel's or a thread's scheduled messages. The `Channel` is set up like the channel screen's,
 * so editing uses the same composer, but it neither loads messages nor marks the channel read.
 */
export const ScheduledMessagesScreen: React.FC<ScheduledMessagesScreenProps> = ({
  route: {
    params: { channel, thread },
  },
}) => {
  const { messageInputFloating } = useAppContext();

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.flex}>
      <Channel
        audioRecordingEnabled={true}
        channel={channel}
        initializeOnMount={false}
        keyboardVerticalOffset={0}
        markReadOnMount={false}
        messageInputFloating={messageInputFloating}
      >
        <ScreenHeader titleText='Scheduled messages' />
        <ChannelScheduledMessages view={thread?.scheduledMessages} />
      </Channel>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
