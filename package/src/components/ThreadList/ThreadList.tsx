import React, { useEffect } from 'react';
import { FlatList, View } from 'react-native';

import { Thread, ThreadManagerState } from 'stream-chat';

import { ThreadListItem } from './ThreadListItem';
import { ThreadListItemSkeleton } from './ThreadListItemSkeleton';

import { useChatContext } from '../../contexts';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import {
  ThreadsContextValue,
  ThreadsProvider,
  useThreadsContext,
} from '../../contexts/threadsContext/ThreadsContext';
import { useStateStore } from '../../hooks';

import { EmptyStateIndicator } from '../Indicators/EmptyStateIndicator';
import { LoadingIndicator } from '../Indicators/LoadingIndicator';

const selector = (nextValue: ThreadManagerState) =>
  ({
    isLoading: nextValue.pagination.isLoading,
    isLoadingNext: nextValue.pagination.isLoadingNext,
    threads: nextValue.threads,
  }) as const;

export type ThreadListProps = Pick<
  ThreadsContextValue,
  'additionalFlatListProps' | 'isFocused' | 'onThreadSelect'
>;

export const DefaultThreadListEmptyPlaceholder = () => <EmptyStateIndicator listType='threads' />;

export const DefaultThreadListLoadingIndicator = () => (
  <View style={{ flex: 1 }}>
    {Array.from({ length: 10 }).map((_, index) => (
      <ThreadListItemSkeleton key={index} />
    ))}
  </View>
);
export const DefaultThreadListLoadingNextIndicator = () => <LoadingIndicator />;

const renderItem = (props: { item: Thread }) => <ThreadListItem thread={props.item} />;

export const DefaultThreadListComponent = () => {
  const { additionalFlatListProps, isLoading, isLoadingNext, loadMore, threads } =
    useThreadsContext();
  const {
    ThreadListEmptyPlaceholder,
    ThreadListLoadingIndicator,
    ThreadListLoadingMoreIndicator,
    ThreadListUnreadBanner,
  } = useComponentsContext();

  if (isLoading) {
    return <ThreadListLoadingIndicator />;
  }

  return (
    <>
      <ThreadListUnreadBanner />
      <FlatList
        contentContainerStyle={{ flexGrow: 1 }}
        data={threads}
        keyExtractor={(props) => props.id}
        ListEmptyComponent={ThreadListEmptyPlaceholder}
        ListFooterComponent={isLoadingNext ? ThreadListLoadingMoreIndicator : null}
        onEndReached={loadMore}
        renderItem={renderItem}
        testID='thread-flatlist'
        {...additionalFlatListProps}
      />
    </>
  );
};

export const ThreadList = (props: ThreadListProps) => {
  const { isFocused = true } = props;
  const { ThreadListComponent: ThreadListContent } = useComponentsContext();
  const { client } = useChatContext();

  useEffect(() => {
    if (!client) {
      return;
    }
    if (isFocused) {
      client.threads.activate();
    } else {
      client.threads.deactivate();
    }
  }, [client, isFocused]);

  useEffect(() => {
    if (!client) {
      return;
    }

    const listener = client.on('connection.recovered', () => {
      client.threads.reload({ force: true });
    });

    return () => {
      client.threads.deactivate();
      listener.unsubscribe();
    };
  }, [client]);

  const { isLoading, isLoadingNext, threads } = useStateStore(client.threads.state, selector);

  return (
    <ThreadsProvider
      value={{ isLoading, isLoadingNext, loadMore: client.threads.loadNextPage, threads, ...props }}
    >
      <ThreadListContent />
    </ThreadsProvider>
  );
};
