import React, { useCallback, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Channel, Thread, ThreadState } from 'stream-chat';

import { ThreadType, useChatContext, useTranslationContext } from '../../contexts';
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
          {parentMessage?.text}
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
              {lastReply?.text}
            </Text>
            <Text style={{ alignSelf: 'flex-end' }}>{dateString}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
