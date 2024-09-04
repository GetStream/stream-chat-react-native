import React, { useEffect } from 'react';
import { FlatList, FlatListProps, Text } from 'react-native';

import { Thread, ThreadManagerState } from 'stream-chat';

import { useChatContext } from '../../contexts';
import { useStateStore } from '../../hooks';

const selector = (nextValue: ThreadManagerState) => [nextValue.threads] as const;

export type ThreadListProps = {
  additionalFlatListProps?: Partial<FlatListProps<Thread>>;
};

export const ThreadList = (props: ThreadListProps) => {
  const { client } = useChatContext();
  const [threads] = useStateStore(client.threads.state, selector);
  console.log('TR: ', threads.length);

  return (
    <FlatList
      data={threads}
      renderItem={() => <Text>I AM A THREAD LIST ITEM.</Text>}
      {...props.additionalFlatListProps}
    />
  );
};
