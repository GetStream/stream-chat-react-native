import React, { useEffect } from 'react';
import { FlatList, FlatListProps } from 'react-native';

import { Channel, Thread, ThreadManagerState } from 'stream-chat';

import { ThreadListItem } from './ThreadListItem';
import { ThreadListUnreadBanner } from './ThreadListUnreadBanner';

import { ThreadType, useChatContext } from '../../contexts';
import { useStateStore } from '../../hooks';
import { EmptyStateIndicator } from '../Indicators/EmptyStateIndicator';
import { LoadingIndicator } from '../Indicators/LoadingIndicator';

const selector = (nextValue: ThreadManagerState) =>
  [nextValue.threads, nextValue.pagination.isLoading] as const;

export type ThreadListProps = {
  additionalFlatListProps?: Partial<FlatListProps<Thread>>;
  onThreadSelect?: (thread: ThreadType, channel: Channel) => void;
};

const ThreadListEmptyPlaceholder = () => <EmptyStateIndicator listType='threads' />;

const ThreadListLoadingIndicator = () => <LoadingIndicator listType='threads' />;

export const ThreadList = (props: ThreadListProps) => {
  const { client } = useChatContext();
  useEffect(() => {
    client.threads.activate();
    return () => {
      client.threads.deactivate();
    };
  }, [client]);
  const [threads, isLoading] = useStateStore(client.threads.state, selector);

  return (
    <>
      <ThreadListUnreadBanner />
      <FlatList
        contentContainerStyle={{ flexGrow: 1 }}
        data={threads}
        ListEmptyComponent={isLoading ? ThreadListLoadingIndicator : ThreadListEmptyPlaceholder}
        renderItem={({ item: thread }) => (
          <ThreadListItem onThreadSelect={props.onThreadSelect} thread={thread} />
        )}
        {...props.additionalFlatListProps}
      />
    </>
  );
};
