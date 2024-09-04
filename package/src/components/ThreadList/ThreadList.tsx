import React, { useEffect } from 'react';
import { FlatList, FlatListProps } from 'react-native';

import { Thread, ThreadManagerState } from 'stream-chat';

import { ThreadListItem } from './ThreadListItem';

import { useChatContext } from '../../contexts';
import { useStateStore } from '../../hooks';

const selector = (nextValue: ThreadManagerState) => [nextValue.threads] as const;

export type ThreadListProps = {
  additionalFlatListProps?: Partial<FlatListProps<Thread>>;
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
    <FlatList
      data={threads}
      renderItem={({ item: thread }) => <ThreadListItem thread={thread} />}
      {...props.additionalFlatListProps}
    />
  );
};
