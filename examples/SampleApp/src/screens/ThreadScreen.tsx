import React, { useCallback } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import {
  Channel,
  MessageActionsParams,
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
import { useStreamChatContext } from '../context/StreamChatContext.tsx';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomAttachmentPickerSelectionBar } from '../components/AttachmentPickerSelectionBar.tsx';
import { MessageLocation } from '../components/LocationSharing/MessageLocation.tsx';
import { useAppContext } from '../context/AppContext.ts';

const selector = (nextValue: ThreadState) => ({ parentMessage: nextValue.parentMessage }) as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

type ThreadScreenNavigationProp = NativeStackNavigationProp<
  StackNavigatorParamList,
  'ThreadScreen'
>;
type ThreadScreenRouteProp = RouteProp<StackNavigatorParamList, 'ThreadScreen'>;

type ThreadScreenProps = {
  navigation: ThreadScreenNavigationProp;
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
      subtitleText={typing ? typing : `with ${subtitleText}`}
      titleText='Thread Reply'
    />
  );
};

export const ThreadScreen: React.FC<ThreadScreenProps> = ({
  navigation,
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
  const { setThread } = useStreamChatContext();
  const { messageInputFloating, messageListImplementation } = useAppContext();

  const onPressMessage: NonNullable<React.ComponentProps<typeof Channel>['onPressMessage']> = (
    payload,
  ) => {
    const { message, defaultHandler, emitter } = payload;
    const { shared_location } = message ?? {};
    if (emitter === 'messageContent' && shared_location) {
      navigation.navigate('MapScreen', shared_location);
    }
    defaultHandler?.();
  };

  const messageActions = useCallback(
    (params: MessageActionsParams) => {
      if (!chatClient) {
        return [];
      }
      return channelMessageActions({
        params,
        chatClient,
        t,
      });
    },
    [chatClient, t],
  );

  const onThreadDismount = useCallback(() => {
    setThread(null);
  }, [setThread]);

  return (
    <View style={[styles.container, { backgroundColor: white }]}>
      <Channel
        audioRecordingEnabled={false}
        AttachmentPickerSelectionBar={CustomAttachmentPickerSelectionBar}
        channel={channel}
        enforceUniqueReaction
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -300}
        messageActions={messageActions}
        messageInputFloating={messageInputFloating}
        MessageHeader={MessageReminderHeader}
        MessageLocation={MessageLocation}
        onPressMessage={onPressMessage}
        thread={thread}
        threadList
      >
        <ThreadHeader thread={thread} />
        <Thread onThreadDismount={onThreadDismount} shouldUseFlashList={messageListImplementation === 'flashlist'} />
      </Channel>
    </View>
  );
};
