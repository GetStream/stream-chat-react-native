import React, { useEffect } from 'react';
import { FlatList } from 'react-native';

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
import type { DefaultStreamChatGenerics } from '../../types/types';
import { EmptyStateIndicator } from '../Indicators/EmptyStateIndicator';
import { LoadingIndicator } from '../Indicators/LoadingIndicator';

const selector = (nextValue: ThreadManagerState) =>
  [nextValue.threads, nextValue.pagination.isLoading, nextValue.pagination.isLoadingNext] as const;

export type ThreadListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  ThreadsContextValue<StreamChatGenerics>,
  | 'additionalFlatListProps'
  | 'isFocused'
  | 'onThreadSelect'
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
  return (
    <>
      <ThreadListUnreadBanner />
      <FlatList
        contentContainerStyle={{ flexGrow: 1 }}
        data={threads}
        keyExtractor={(props) => props.id}
        ListEmptyComponent={isLoading ? ThreadListLoadingIndicator : ThreadListEmptyPlaceholder}
        ListFooterComponent={isLoadingNext ? ThreadListLoadingMoreIndicator : null}
        onEndReached={loadMore}
        renderItem={DefaultThreadListItem}
        {...additionalFlatListProps}
        testID='thread-flatlist'
      />
    </>
  );
};

export const ThreadList = (props: ThreadListProps) => {
  const { isFocused = true, ThreadList = ThreadListComponent } = props;
  const { client } = useChatContext();
  useEffect(() => {
    if (!client) return;
    if (isFocused) {
      client.threads.activate();
    } else {
      client.threads.deactivate();
    }
  }, [client, isFocused]);
  const [threads, isLoading, isLoadingNext] = useStateStore(client.threads.state, selector);

  return (
    <ThreadsProvider
      value={{ isLoading, isLoadingNext, loadMore: client.threads.loadNextPage, threads, ...props }}
    >
      <ThreadList />
    </ThreadsProvider>
  );
};
