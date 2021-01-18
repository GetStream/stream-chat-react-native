import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Channel,
  Thread,
  useAttachmentPickerContext,
  useTheme,
} from 'stream-chat-react-native';

import { ScreenHeader } from '../components/ScreenHeader';

import type { RouteProp } from '@react-navigation/native';

import type {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalReactionType,
  LocalUserType,
  StackNavigatorParamList,
} from '../types';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

type ThreadScreenRouteProp = RouteProp<StackNavigatorParamList, 'ThreadScreen'>;

type ThreadScreenProps = {
  route: ThreadScreenRouteProp;
};
export const ThreadScreen: React.FC<ThreadScreenProps> = ({
  route: {
    params: { channel, thread },
  },
}) => {
  const {
    theme: {
      colors: { white },
    },
  } = useTheme();
  const { setSelectedImages } = useAttachmentPickerContext();

  useEffect(() => {
    setSelectedImages([]);
    return () => setSelectedImages([]);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: white }]}>
      <Channel<
        LocalAttachmentType,
        LocalChannelType,
        LocalCommandType,
        LocalEventType,
        LocalMessageType,
        LocalReactionType,
        LocalUserType
      >
        channel={channel}
        enforceUniqueReaction
        keyboardVerticalOffset={0}
        thread={thread}
      >
        <View style={styles.container}>
          <ScreenHeader
            inSafeArea
            subtitleText={`with ${thread?.user?.name}`}
            titleText='Thread Reply'
          />
          <Thread<
            LocalAttachmentType,
            LocalChannelType,
            LocalCommandType,
            LocalEventType,
            LocalMessageType,
            LocalReactionType,
            LocalUserType
          > />
        </View>
      </Channel>
    </SafeAreaView>
  );
};
