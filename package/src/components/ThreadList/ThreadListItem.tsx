import React, { useCallback, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Thread, ThreadState } from 'stream-chat';

import { TranslationContextValue, useChatContext, useTranslationContext } from '../../contexts';
import {
  ThreadListItemProvider,
  useThreadListItemContext,
} from '../../contexts/threadsContext/ThreadListItemContext';
import { useThreadsContext } from '../../contexts/threadsContext/ThreadsContext';
import { useStateStore } from '../../hooks';
import { MessageBubble } from '../../icons';
import { getDateString } from '../../utils/i18n/getDateString';
import { Avatar } from '../Avatar/Avatar';
import { MessageType } from '../MessageList/hooks/useMessageList';

export type ThreadListItemProps = {
  thread: Thread;
  timestampTranslationKey?: string;
};

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
  const { channel, dateString, lastReply, ownUnreadMessageCount, parentMessage, thread } =
    useThreadListItemContext();
  const { onThreadSelect } = useThreadsContext();
  const { client } = useChatContext();
  const { t } = useTranslationContext();

  return (
    <TouchableOpacity
      onPress={() => {
        if (onThreadSelect) {
          onThreadSelect({ thread: parentMessage as MessageType, threadInstance: thread }, channel);
        }
      }}
      style={{
        flex: 1,
        paddingHorizontal: 8,
        paddingVertical: 14,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        <MessageBubble />
        <Text style={{ fontSize: 14, fontWeight: '500' }}>{channel?.data?.name || 'N/A'}</Text>
      </View>
      <View style={{ alignItems: 'center', flexDirection: 'row' }}>
        <Text numberOfLines={1} style={{ color: '#7E828B', flex: 1, fontSize: 12 }}>
          {t<string>('replied to')}: {getTitleFromMessage({ message: parentMessage, t })}
        </Text>
        <View
          style={{
            alignItems: 'center',
            alignSelf: 'flex-end',
            backgroundColor: '#FF3842',
            borderRadius: 50,
            height: 22,
            justifyContent: 'center',
            width: 22,
          }}
        >
          <Text
            style={{
              color: 'white',
            }}
          >
            {ownUnreadMessageCount}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        <Avatar
          containerStyle={{ marginRight: 8 }}
          image={lastReply?.user?.image as string}
          online={lastReply?.user?.online}
          size={40}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '500' }}>{lastReply?.user?.name}</Text>
          <View style={{ flexDirection: 'row' }}>
            <Text
              numberOfLines={1}
              style={{ color: '#7E828B', flex: 1, fontSize: 14, marginTop: 4 }}
            >
              {getTitleFromMessage({
                currentUserId: client.userID,
                message: lastReply,
                t,
              })}
            </Text>
            <Text style={{ alignSelf: 'flex-end', color: '#7E828B' }}>{dateString}</Text>
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
      ] as const,
    [client],
  );

  const [lastReply, ownUnreadMessageCount, parentMessage, channel] = useStateStore(
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

  return (
    <ThreadListItemProvider
      value={{
        channel,
        dateString,
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
