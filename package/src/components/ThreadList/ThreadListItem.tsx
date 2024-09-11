import React, { useCallback, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Channel, FormatMessageResponse, Thread, ThreadState } from 'stream-chat';

import {
  ThreadType,
  TranslationContextValue,
  useChatContext,
  useTranslationContext,
} from '../../contexts';
import { useStateStore } from '../../hooks';
import { MessageBubble } from '../../icons';
import { getDateString } from '../../utils/i18n/getDateString';
import { Avatar } from '../Avatar/Avatar';
import { MessageType } from '../MessageList/hooks/useMessageList';

export type ThreadListItemProps = {
  thread: Thread;
  onThreadSelect?: (thread: ThreadType, channel: Channel) => void;
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
  message?: FormatMessageResponse;
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

export const ThreadListItem = (props: ThreadListItemProps) => {
  const { client } = useChatContext();
  const { t, tDateTimeParser } = useTranslationContext();
  const { onThreadSelect, thread, timestampTranslationKey = 'timestamp/ThreadListItem' } = props;

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

  // if (lastReply) {
  //   console.log('ISE: LAST: ', Object.keys(lastReply.user));
  // }
  // debugger

  return (
    <TouchableOpacity
      onPress={() => {
        if (onThreadSelect) {
          onThreadSelect({ thread: parentMessage as MessageType, threadInstance: thread }, channel);
        }
      }}
      style={{
        borderColor: 'black',
        borderStyle: 'solid',
        borderWidth: 1,
        flex: 1,
        marginVertical: 8,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        <MessageBubble />
        <Text>{channel?.data?.name || 'N/A'}</Text>
      </View>
      <View style={{ flexDirection: 'row' }}>
        <Text numberOfLines={1} style={{ flex: 1 }}>
          {t<string>('replied to')}: {getTitleFromMessage({ message: parentMessage, t })}
        </Text>
        <Text style={{ alignSelf: 'flex-end' }}>{ownUnreadMessageCount}</Text>
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 14, marginHorizontal: 8, marginTop: 6 }}>
        <Avatar
          containerStyle={{ marginRight: 8 }}
          image={lastReply?.user?.image as string}
          online={lastReply?.user?.online}
          size={40}
        />
        <View style={{ flex: 1 }}>
          <Text>{lastReply?.user?.name}</Text>
          <View style={{ flexDirection: 'row' }}>
            <Text numberOfLines={1} style={{ flex: 1 }}>
              {getTitleFromMessage({ currentUserId: client.userID, message: lastReply, t })}
            </Text>
            <Text style={{ alignSelf: 'flex-end' }}>{dateString}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
