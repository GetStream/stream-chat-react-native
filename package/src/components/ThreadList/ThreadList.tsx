import React, { useCallback, useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import type { PaginatorState, Thread } from 'stream-chat';

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
import { useLazyRef } from '../../hooks/useLazyRef';
import { generateRandomId } from '../../utils/utils';

import { EmptyStateIndicator } from '../Indicators/EmptyStateIndicator';
import { LoadingIndicator } from '../Indicators/LoadingIndicator';
import { NotificationTargetProvider } from '../Notifications/NotificationTargetContext';

const NO_THREADS: Thread[] = [];

const paginatorSelector = ({ isLoading, items }: PaginatorState<Thread>) =>
  ({ isLoading, threads: items ?? NO_THREADS }) as const;

export type ThreadListProps = Pick<
  ThreadsContextValue,
  'additionalFlatListProps' | 'isFocused' | 'onThreadSelect'
> & {
  notificationHostId?: string;
};

export const DefaultThreadListEmptyPlaceholder = () => <EmptyStateIndicator listType='threads' />;

export const DefaultThreadListLoadingIndicator = () => (
  <View style={{ flex: 1 }}>
    {Array.from({ length: 10 }).map((_, index) => (
      <ThreadListItemSkeleton key={index} />
    ))}
  </View>
);
export const DefaultThreadListLoadingNextIndicator = () => <LoadingIndicator listType='threads' />;

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
        ListFooterComponent={isLoadingNext ? ThreadListLoadingMoreIndicator : undefined}
        onEndReached={loadMore}
        renderItem={renderItem}
        testID='thread-flatlist'
        {...additionalFlatListProps}
      />
    </>
  );
};

export const ThreadList = (props: ThreadListProps) => {
  const { isFocused = true, notificationHostId: notificationHostIdProp } = props;
  const { NotificationList, ThreadListComponent: ThreadListContent } = useComponentsContext();
  const { client } = useChatContext();
  const fallbackNotificationHostIdRef = useLazyRef(() => `thread-list:${generateRandomId()}`);
  const notificationHostId = notificationHostIdProp ?? fallbackNotificationHostIdRef.current;

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
    return () => client.threads.deactivate();
  }, [client]);

  const { isLoading, threads } = useStateStore(client.threads.paginator.state, paginatorSelector);
  // A no-op until the first page has landed, at the end of the list, and while a page is loading.
  const loadMore = useCallback(async () => {
    await client.threads.paginator.toTail();
  }, [client]);

  return (
    <NotificationTargetProvider hostId={notificationHostId} panel='thread-list'>
      <ThreadsProvider
        value={{
          isLoading: isLoading && !threads.length,
          isLoadingNext: isLoading && threads.length > 0,
          loadMore,
          threads,
          ...props,
        }}
      >
        <View style={styles.container}>
          <ThreadListContent />
          <NotificationList />
        </View>
      </ThreadsProvider>
    </NotificationTargetProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
