import React, { useCallback } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Channel, Thread, ThreadState } from 'stream-chat';

import { useStateStore } from '../../hooks';
import { Avatar } from '../Avatar/Avatar';
import { ThreadType } from '../../contexts';
import { MessageType } from '../../../lib/typescript';

export type ThreadListItemProps = {
  thread: Thread;
  onThreadSelect?: (
    thread: ThreadType,
    channel: Channel,
  ) => void;
};

export const ThreadListItem = (props: ThreadListItemProps) => {
  const { onThreadSelect, thread } = props;

  const selector = useCallback(
    (nextValue: ThreadState) =>
      [nextValue.replies.at(-1), nextValue.parentMessage, nextValue.channel] as const,
    [],
  );

  const [lastReply, parentMessage, channel] = useStateStore(thread.state, selector);

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
      <Text>{channel?.data?.name}</Text>
      <Text numberOfLines={1}>{parentMessage?.text}</Text>
      <View style={{ flexDirection: 'row', marginBottom: 14, marginHorizontal: 8, marginTop: 6 }}>
        <Avatar
          containerStyle={{ marginRight: 8 }}
          image={lastReply?.user?.image as string}
          online={lastReply?.user?.online}
          size={40}
        />
        <View style={{ flex: 1 }}>
          <Text>{lastReply?.user?.name}</Text>
          <Text numberOfLines={1}>{lastReply?.text}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
