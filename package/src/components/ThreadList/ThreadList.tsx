import React, { useEffect } from 'react';
import { FlatList, FlatListProps, Text, TouchableOpacity } from 'react-native';

import { Channel, Thread, ThreadManagerState } from 'stream-chat';

import { ThreadListItem } from './ThreadListItem';

import { useChatContext } from '../../contexts';
import { useStateStore } from '../../hooks';

const selector = (nextValue: ThreadManagerState) => [nextValue.threads] as const;
const unseenThreadIdsSelector = (nextValue: ThreadManagerState) =>
  [nextValue.unseenThreadIds] as const;

export type ThreadListProps = {
  additionalFlatListProps?: Partial<FlatListProps<Thread>>;
  onThreadSelect?: (thread: Thread, channel: Channel) => void;
};

export const ThreadListUnreadBanner = () => {
  const { client } = useChatContext();
  const [unseenThreadIds] = useStateStore(client.threads.state, unseenThreadIdsSelector);
  if (!unseenThreadIds.length) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={() => client.threads.reload()}
      style={{
        backgroundColor: '#080707',
        borderRadius: 16,
        marginHorizontal: 8,
        marginVertical: 6,
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <Text style={{ color: 'white', fontSize: 16 }}>{unseenThreadIds.length} unread threads</Text>
    </TouchableOpacity>
  );
};

export const ThreadList = (props: ThreadListProps) => {
  const { client } = useChatContext();
  useEffect(() => {
    client.threads.activate();
    return () => {
      client.threads.deactivate();
    };
  }, [client]);
  const [threads] = useStateStore(client.threads.state, selector);

  return (
    <>
      <ThreadListUnreadBanner />
      <FlatList
        data={threads}
        renderItem={({ item: thread }) => (
          <ThreadListItem onThreadSelect={props.onThreadSelect} thread={thread} />
        )}
        {...props.additionalFlatListProps}
      />
    </>
  );
};
