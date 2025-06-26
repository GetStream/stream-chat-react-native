import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  AttachmentManagerState,
  ChannelState,
  DraftMessage,
  LocalMessage,
  MessageResponse,
  TextComposerState,
  Thread,
  ThreadState,
} from 'stream-chat';

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
import { FileTypes } from '../../types/types';
import { getDateString } from '../../utils/i18n/getDateString';
import { Avatar } from '../Avatar/Avatar';
import { useChannelPreviewDisplayName } from '../ChannelPreview/hooks/useChannelPreviewDisplayName';
import { MessagePreview } from '../MessagePreview/MessagePreview';

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

type LatestMessage = ReturnType<ChannelState['formatMessage']> | MessageResponse;

const getMessageSenderName = (
  message: LatestMessage | undefined,
  currentUserId: string | undefined,
  t: (key: string) => string,
) => {
  if (message?.user?.id === currentUserId) {
    return t('You');
  }

  return message?.user?.name || message?.user?.username || message?.user?.id || '';
};

const getPreviewFromMessage = ({
  t,
  currentUserId,
  draftMessage,
  parentMessage = false,
  message,
}: {
  t: TranslationContextValue['t'];
  currentUserId?: string;
  draftMessage?: DraftMessage;
  parentMessage?: boolean;
  message?: LocalMessage;
}) => {
  if (draftMessage) {
    if (draftMessage.attachments?.length) {
      const attachment = draftMessage?.attachments?.at(0);

      const attachmentIcon = attachment
        ? `${
            attachmentTypeIconMap[
              (attachment.type as keyof typeof attachmentTypeIconMap) ?? 'file'
            ] ?? attachmentTypeIconMap.file
          } `
        : '';

      if (attachment?.type === FileTypes.VoiceRecording) {
        return [
          { bold: true, draft: true, text: 'Draft: ' },
          { bold: false, text: attachmentIcon },
          {
            bold: false,
            text: t('Voice message'),
          },
        ];
      }
      return [
        { bold: true, draft: true, text: 'Draft: ' },
        { bold: false, text: attachmentIcon },
        {
          bold: false,
          text:
            attachment?.type === FileTypes.Image
              ? attachment?.fallback
                ? attachment?.fallback
                : 'N/A'
              : attachment?.title
                ? attachment?.title
                : 'N/A',
        },
      ];
    }

    if (draftMessage.text) {
      return [
        { bold: true, draft: true, text: 'Draft: ' },
        {
          bold: false,
          text: draftMessage.text,
        },
      ];
    }
  }

  if (message) {
    const messageSender = getMessageSenderName(message, currentUserId, t);
    const messageSenderText = !parentMessage ? (messageSender ? `${messageSender}: ` : '') : '';
    const isNotOwner = message.user?.id !== currentUserId;

    if (message.text) {
      return [
        { bold: isNotOwner, text: messageSenderText },
        { bold: false, text: message.text || 'N/A' },
      ];
    }
    if (message.command) {
      return [
        { bold: isNotOwner, text: messageSenderText },
        { bold: false, text: `/${message.command}` },
      ];
    }

    if (message?.deleted_at && message.parent_id) {
      return [
        { bold: isNotOwner, text: messageSenderText },
        { bold: false, text: `${t('This reply was deleted')}.` },
      ];
    }

    if (message?.deleted_at && !message.parent_id) {
      return [
        { bold: isNotOwner, text: messageSenderText },
        { bold: false, text: `${t('The source message was deleted')}.` },
      ];
    }

    if (message?.attachments?.length) {
      const attachment = message?.attachments?.at(0);

      const attachmentIcon = attachment
        ? `${
            attachmentTypeIconMap[
              (attachment.type as keyof typeof attachmentTypeIconMap) ?? 'file'
            ] ?? attachmentTypeIconMap.file
          } `
        : '';

      if (attachment?.type === FileTypes.VoiceRecording) {
        return [
          { bold: false, text: attachmentIcon },
          {
            bold: isNotOwner,
            text: messageSenderText,
          },
          {
            bold: false,
            text: t('Voice message'),
          },
        ];
      }

      return [
        { bold: false, text: attachmentIcon },
        { bold: isNotOwner, text: messageSenderText },
        {
          bold: false,
          text:
            attachment?.type === FileTypes.Image
              ? attachment?.fallback
                ? attachment?.fallback
                : 'N/A'
              : attachment?.title
                ? attachment?.title
                : 'N/A',
        },
      ];
    }
  }

  return [{ bold: false, text: t('Empty message...') }];
};

const textComposerStateSelector = (state: TextComposerState) => ({
  text: state.text,
});

const stateSelector = (state: AttachmentManagerState) => ({
  attachments: state.attachments,
});

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
  const { text: draftText } = useStateStore(
    thread.messageComposer.textComposer.state,
    textComposerStateSelector,
  );

  const { attachments } = useStateStore(
    thread.messageComposer.attachmentManager.state,
    stateSelector,
  );

  useEffect(() => {
    const unsubscribe = thread.messageComposer.registerDraftEventSubscriptions();
    return () => unsubscribe();
  }, [thread.messageComposer]);

  const draftMessage: DraftMessage | undefined = useMemo(
    () =>
      !thread.messageComposer.compositionIsEmpty
        ? {
            attachments,
            id: thread.messageComposer.id,
            text: draftText,
          }
        : undefined,
    [thread.messageComposer, attachments, draftText],
  );

  const previews = useMemo(() => {
    return getPreviewFromMessage({
      currentUserId: client.userID,
      draftMessage,
      message: lastReply as LocalMessage,
      t,
    });
  }, [client.userID, draftMessage, lastReply, t]);

  const parentMessagePreview = useMemo(() => {
    return [
      {
        bold: true,
        text: `${t('replied to')}: `,
      },
      ...getPreviewFromMessage({
        currentUserId: client.userID,
        message: parentMessage as LocalMessage,
        parentMessage: true,
        t,
      }),
    ];
  }, [client.userID, parentMessage, t]);

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
          <MessagePreview previews={parentMessagePreview} />
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
            <View style={[styles.previewMessageContainer, threadListItem.previewMessageContainer]}>
              <MessagePreview previews={previews} />
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
