import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Channel,
  Thread,
  ThreadType,
  useChatContext,
  useTheme,
  useTranslationContext,
  useTypingString,
} from 'stream-chat-react-native';
import { useStateStore } from 'stream-chat-react-native';

import { ScreenHeader } from '../components/ScreenHeader';

import type { RouteProp } from '@react-navigation/native';

import type { StackNavigatorParamList } from '../types';
import { LocalMessage, ThreadState, UserResponse } from 'stream-chat';
import { useCreateDraftFocusEffect } from '../utils/useCreateDraftFocusEffect.tsx';
import { MessageReminderHeader } from '../components/Reminders/MessageReminderHeader.tsx';
import { channelMessageActions } from '../utils/messageActions.tsx';

const selector = (nextValue: ThreadState) => ({ parentMessage: nextValue.parentMessage }) as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

type ThreadScreenRouteProp = RouteProp<StackNavigatorParamList, 'ThreadScreen'>;

type ThreadScreenProps = {
  route: ThreadScreenRouteProp;
};

export type ThreadHeaderProps = {
  thread: LocalMessage | ThreadType;
};

const ThreadHeader: React.FC<ThreadHeaderProps> = ({ thread }) => {
  const typing = useTypingString();
  let subtitleText = ((thread as LocalMessage)?.user as UserResponse)?.name;
  const { parentMessage } =
    useStateStore((thread as ThreadType)?.threadInstance?.state, selector) || {};

  if (subtitleText == null) {
    subtitleText = (parentMessage?.user as UserResponse)?.name;
  }

  useCreateDraftFocusEffect();

  return (
    <ScreenHeader
      inSafeArea
      subtitleText={typing ? typing : `with ${subtitleText}`}
      titleText='Thread Reply'
    />
  );
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
  const { client: chatClient } = useChatContext();
  const { t } = useTranslationContext();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: white }]}>
      <Channel
        audioRecordingEnabled={true}
        channel={channel}
        enforceUniqueReaction
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -300}
        messageActions={(params) => {
          return channelMessageActions({
            params,
            chatClient,
            t,
          });
        }}
        MessageHeader={MessageReminderHeader}
        thread={thread}
        threadList
      >
        <View style={styles.container}>
          <ThreadHeader thread={thread} />
          <Thread />
        </View>
      </Channel>
    </SafeAreaView>
  );
};
