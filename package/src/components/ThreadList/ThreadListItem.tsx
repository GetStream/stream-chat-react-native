import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { LocalMessage, Thread, ThreadState } from 'stream-chat';

import { useChatContext, useTheme, useTranslationContext } from '../../contexts';
import {
  ThreadListItemProvider,
  useThreadListItemContext,
} from '../../contexts/threadsContext/ThreadListItemContext';
import { useThreadsContext } from '../../contexts/threadsContext/ThreadsContext';
import { useStateStore } from '../../hooks';
import { MessageBubble } from '../../icons';
import { getDateString } from '../../utils/i18n/getDateString';
import { useChannelPreviewDisplayName } from '../ChannelPreview/hooks/useChannelPreviewDisplayName';
import { MessagePreview } from '../MessagePreview/MessagePreview';
import { UserAvatar } from '../ui/Avatar/UserAvatar';

export type ThreadListItemProps = {
  thread: Thread;
  timestampTranslationKey?: string;
};

const styles = StyleSheet.create({
  boldText: { fontSize: 14, fontWeight: '500' },
  contentRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  contentTextWrapper: {
    flex: 1,
    marginLeft: 8,
  },
  dateText: { alignSelf: 'flex-end' },
  headerRow: {
    flexDirection: 'row',
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  parentMessagePreviewContainer: {
    flex: 1,
    marginVertical: 2,
  },
  previewMessageContainer: {
    flex: 1,
    marginTop: 4,
  },
  touchableWrapper: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  unreadBubbleWrapper: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderRadius: 50,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
});

export const attachmentTypeIconMap = {
  audio: '🔈',
  file: '📄',
  image: '📷',
  video: '🎥',
  voiceRecording: '🎙️',
} as const;

export const ThreadListItemComponent = () => {
  const {
    channel,
    dateString,
    deletedAtDateString,
    lastReply,
    ownUnreadMessageCount,
    parentMessage,
    thread,
  } = useThreadListItemContext();
  const displayName = useChannelPreviewDisplayName(channel);
  const { onThreadSelect } = useThreadsContext();
  const {
    theme: {
      colors: { accent_red, text_low_emphasis, white },
      threadListItem,
    },
  } = useTheme();

  useEffect(() => {
    const unsubscribe = thread.messageComposer.registerDraftEventSubscriptions();
    return () => unsubscribe();
  }, [thread.messageComposer]);

  return (
    <TouchableOpacity
      onPress={() => {
        if (onThreadSelect) {
          onThreadSelect(
            { thread: parentMessage as LocalMessage, threadInstance: thread },
            channel,
          );
        }
      }}
      style={[styles.touchableWrapper, threadListItem.touchableWrapper]}
      testID='thread-list-item'
    >
      <View style={[styles.headerRow, threadListItem.headerRow]}>
        <MessageBubble />
        <Text
          numberOfLines={1}
          style={[styles.boldText, { color: text_low_emphasis }, threadListItem.boldText]}
        >
          {displayName || 'N/A'}
        </Text>
      </View>
      <View style={[styles.infoRow, threadListItem.infoRow]}>
        <View
          style={[
            styles.parentMessagePreviewContainer,
            threadListItem.parentMessagePreviewContainer,
          ]}
        >
          <MessagePreview message={parentMessage as LocalMessage} />
        </View>
        {ownUnreadMessageCount > 0 && !deletedAtDateString ? (
          <View
            style={[
              styles.unreadBubbleWrapper,
              { backgroundColor: accent_red },
              threadListItem.unreadBubbleWrapper,
            ]}
          >
            <Text style={[{ color: white }, threadListItem.unreadBubbleText]}>
              {ownUnreadMessageCount}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.contentRow, threadListItem.contentRow]}>
        {lastReply?.user ? (
          <UserAvatar user={lastReply?.user} size='lg' showOnlineIndicator showBorder />
        ) : null}

        <View style={[styles.contentTextWrapper, threadListItem.contentTextWrapper]}>
          <Text style={[styles.boldText, { color: text_low_emphasis }, threadListItem.boldText]}>
            {lastReply?.user?.name}
          </Text>
          <View style={[styles.headerRow, threadListItem.headerRow]}>
            <View style={[styles.previewMessageContainer, threadListItem.previewMessageContainer]}>
              <MessagePreview message={lastReply as LocalMessage} />
            </View>

            <Text style={[styles.dateText, { color: text_low_emphasis }, threadListItem.dateText]}>
              {deletedAtDateString ?? dateString}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const ThreadListItem = (props: ThreadListItemProps) => {
  const { client } = useChatContext();
  const { t, tDateTimeParser } = useTranslationContext();
  const { thread, timestampTranslationKey = 'timestamp/ThreadListItem' } = props;
  const { ThreadListItem = ThreadListItemComponent } = useThreadsContext();

  const selector = useCallback(
    (nextValue: ThreadState) =>
      ({
        channel: nextValue.channel,
        deletedAt: nextValue.deletedAt,
        lastReply: nextValue.replies.at(-1),
        ownUnreadMessageCount:
          (client.userID && nextValue.read[client.userID]?.unreadMessageCount) || 0,
        parentMessage: nextValue.parentMessage,
      }) as const,
    [client],
  );

  const { channel, deletedAt, lastReply, ownUnreadMessageCount, parentMessage } = useStateStore(
    thread.state,
    selector,
  );

  const timestamp = lastReply?.created_at;

  // TODO: Please rethink this, we have the same line of code in about 5 places in the SDK.
  const dateString = useMemo(
    () =>
      getDateString({
        date: timestamp,
        t,
        tDateTimeParser,
        timestampTranslationKey,
      }),
    [timestamp, t, tDateTimeParser, timestampTranslationKey],
  );
  const deletedAtDateString = useMemo(
    () =>
      getDateString({
        date: deletedAt as Date | undefined,
        t,
        tDateTimeParser,
        timestampTranslationKey,
      }),
    [deletedAt, t, tDateTimeParser, timestampTranslationKey],
  );

  return (
    <ThreadListItemProvider
      value={{
        channel,
        dateString,
        deletedAtDateString,
        lastReply,
        ownUnreadMessageCount,
        parentMessage,
        thread,
      }}
    >
      <ThreadListItem />
    </ThreadListItemProvider>
  );
};
