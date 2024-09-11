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
  [nextValue.threads, nextValue.pagination.isLoading] as const;

export type ThreadListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  ThreadsContextValue<StreamChatGenerics>,
  | 'additionalFlatListProps'
  | 'onThreadSelect'
  | 'ThreadListEmptyPlaceholder'
  | 'ThreadListLoadingIndicator'
> & { ThreadList?: React.ComponentType };

export const DefaultThreadListEmptyPlaceholder = () => <EmptyStateIndicator listType='threads' />;

export const DefaultThreadListLoadingIndicator = () => <LoadingIndicator listType='threads' />;

const DefaultThreadListItem = (props: { item: Thread }) => <ThreadListItem thread={props.item} />;

const ThreadListComponent = () => {
  const {
    additionalFlatListProps,
    isLoading,
    ThreadListEmptyPlaceholder = DefaultThreadListEmptyPlaceholder,
    ThreadListLoadingIndicator = DefaultThreadListLoadingIndicator,
    ThreadListUnreadBanner = DefaultThreadListBanner,
    threads,
  } = useThreadsContext();
  return (
    <>
      <ThreadListUnreadBanner />
      <FlatList
        contentContainerStyle={{ flexGrow: 1 }}
        data={threads}
        ListEmptyComponent={isLoading ? ThreadListLoadingIndicator : ThreadListEmptyPlaceholder}
        renderItem={DefaultThreadListItem}
        {...additionalFlatListProps}
      />
    </>
  );
};

export const ThreadList = (props: ThreadListProps) => {
  const { ThreadList = ThreadListComponent } = props;
  const { client } = useChatContext();
  useEffect(() => {
    client.threads.activate();
    return () => {
      client.threads.deactivate();
    };
  }, [client]);
  const [threads, isLoading] = useStateStore(client.threads.state, selector);

  return (
    <ThreadsProvider value={{ isLoading, threads, ...props }}>
      <ThreadList />
    </ThreadsProvider>
  );
};
