import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Thread, ThreadState } from 'stream-chat';

import {
  TranslationContextValue,
  useChatContext,
  useTheme,
  useTranslationContext,
} from '../../contexts';
import {
  ThreadListItemProvider,
  useThreadListItemContext,
} from '../../contexts/threadsContext/ThreadListItemContext';
import { useThreadsContext } from '../../contexts/threadsContext/ThreadsContext';
import { useStateStore } from '../../hooks';
import { MessageBubble } from '../../icons';
import { getDateString } from '../../utils/i18n/getDateString';
import { Avatar } from '../Avatar/Avatar';
import { useChannelPreviewDisplayName } from '../ChannelPreview/hooks/useChannelPreviewDisplayName';
import { MessageType } from '../MessageList/hooks/useMessageList';

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
  lastReplyText: { flex: 1, fontSize: 14, marginTop: 4 },
  parentMessageText: { flex: 1, fontSize: 12 },
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

const getTitleFromMessage = ({
  currentUserId,
  message,
  t,
}: {
  t: TranslationContextValue['t'];
  currentUserId?: string;
  message?: MessageType | undefined;
}) => {
  const attachment = message?.attachments?.at(0);

  const attachmentIcon = attachment
    ? `${
        attachmentTypeIconMap[(attachment.type as keyof typeof attachmentTypeIconMap) ?? 'file'] ??
        attachmentTypeIconMap.file
      } `
    : '';

  const messageBelongsToCurrentUserPrefix =
    message?.user?.id === currentUserId ? `${t('You')}: ` : '';

  if (message?.deleted_at && message.parent_id)
    return `${messageBelongsToCurrentUserPrefix}${t('This reply was deleted')}.`;

  if (message?.deleted_at && !message.parent_id)
    return `${messageBelongsToCurrentUserPrefix}${t('The source message was deleted')}.`;

  if (attachment?.type === 'voiceRecording')
    return `${attachmentIcon}${messageBelongsToCurrentUserPrefix}${t('Voice message')}.`;

  return `${attachmentIcon}${messageBelongsToCurrentUserPrefix}${
    message?.text || attachment?.fallback || 'N/A'
  }`;
};

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
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const {
    theme: {
      colors: { accent_red, text_low_emphasis, white },
      threadListItem,
    },
  } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => {
        if (onThreadSelect) {
          onThreadSelect({ thread: parentMessage as MessageType, threadInstance: thread }, channel);
        }
      }}
      style={[styles.touchableWrapper, threadListItem.touchableWrapper]}
      testID='thread-list-item'
    >
      <View style={[styles.headerRow, threadListItem.headerRow]}>
        <MessageBubble />
        <Text style={[styles.boldText, { color: text_low_emphasis }, threadListItem.boldText]}>
          {displayName || 'N/A'}
        </Text>
      </View>
      <View style={[styles.infoRow, threadListItem.infoRow]}>
        <Text
          numberOfLines={1}
          style={[
            styles.parentMessageText,
            { color: text_low_emphasis },
            threadListItem.parentMessageText,
          ]}
        >
          {t<string>('replied to')}: {getTitleFromMessage({ message: parentMessage, t })}
        </Text>
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
        <Avatar
          image={lastReply?.user?.image as string}
          online={lastReply?.user?.online}
          size={40}
        />
        <View style={[styles.contentTextWrapper, threadListItem.contentTextWrapper]}>
          <Text style={[styles.boldText, { color: text_low_emphasis }, threadListItem.boldText]}>
            {lastReply?.user?.name}
          </Text>
          <View style={[styles.headerRow, threadListItem.headerRow]}>
            <Text
              numberOfLines={1}
              style={[
                styles.lastReplyText,
                { color: text_low_emphasis },
                threadListItem.lastReplyText,
              ]}
            >
              {deletedAtDateString
                ? 'This thread was deleted.'
                : getTitleFromMessage({
                    currentUserId: client.userID,
                    message: lastReply,
                    t,
                  })}
            </Text>
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
      [
        nextValue.replies.at(-1),
        (client.userID && nextValue.read[client.userID]?.unreadMessageCount) || 0,
        nextValue.parentMessage,
        nextValue.channel,
        nextValue.deletedAt,
      ] as const,
    [client],
  );

  const [lastReply, ownUnreadMessageCount, parentMessage, channel, deletedAt] = useStateStore(
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
