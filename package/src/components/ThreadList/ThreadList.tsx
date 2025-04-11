import React, { useEffect } from 'react';
import { FlatList, View } from 'react-native';

import { Thread, ThreadManagerState } from 'stream-chat';

import { ThreadListItem } from './ThreadListItem';
import { ThreadListUnreadBanner as DefaultThreadListBanner } from './ThreadListUnreadBanner';

import { useChatContext } from '../../contexts';
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
  | 'additionalFlatListProps'
  | 'isFocused'
  | 'onThreadSelect'
  | 'ThreadListItem'
  | 'ThreadListEmptyPlaceholder'
  | 'ThreadListLoadingIndicator'
  | 'ThreadListUnreadBanner'
> & { ThreadList?: React.ComponentType };

export const DefaultThreadListEmptyPlaceholder = () => <EmptyStateIndicator listType='threads' />;

export const DefaultThreadListLoadingIndicator = () => <LoadingIndicator listType='threads' />;
export const DefaultThreadListLoadingNextIndicator = () => <LoadingIndicator />;

const DefaultThreadListItem = (props: { item: Thread }) => <ThreadListItem thread={props.item} />;

const ThreadListComponent = () => {
  const {
    additionalFlatListProps,
    isLoading,
    isLoadingNext,
    loadMore,
    ThreadListEmptyPlaceholder = DefaultThreadListEmptyPlaceholder,
    ThreadListLoadingIndicator = DefaultThreadListLoadingIndicator,
    ThreadListLoadingMoreIndicator = DefaultThreadListLoadingNextIndicator,
    ThreadListUnreadBanner = DefaultThreadListBanner,
    threads,
  } = useThreadsContext();

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <ThreadListLoadingIndicator />
      </View>
    );
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
        renderItem={DefaultThreadListItem}
        testID='thread-flatlist'
        {...additionalFlatListProps}
      />
    </>
  );
};

export const ThreadList = (props: ThreadListProps) => {
  const { isFocused = true, ThreadList = ThreadListComponent } = props;
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
      <ThreadList />
    </ThreadsProvider>
  );
};
