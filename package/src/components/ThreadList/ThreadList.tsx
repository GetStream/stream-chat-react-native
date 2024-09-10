import React, { useEffect } from 'react';
import { FlatList, FlatListProps, Text, TouchableOpacity } from 'react-native';

import { Channel, Thread, ThreadManagerState } from 'stream-chat';

import { ThreadListItem } from './ThreadListItem';

import { ThreadType, useChatContext } from '../../contexts';
import { useStateStore } from '../../hooks';
import { Reload } from '../../icons';
import { EmptyStateIndicator } from '../Indicators/EmptyStateIndicator';
import { LoadingIndicator } from '../Indicators/LoadingIndicator';

const selector = (nextValue: ThreadManagerState) =>
  [nextValue.threads, nextValue.pagination.isLoading] as const;
const unseenThreadIdsSelector = (nextValue: ThreadManagerState) =>
  [nextValue.unseenThreadIds] as const;

export type ThreadListProps = {
  additionalFlatListProps?: Partial<FlatListProps<Thread>>;
  onThreadSelect?: (thread: ThreadType, channel: Channel) => void;
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
        flexDirection: 'row',
        marginHorizontal: 8,
        marginVertical: 6,
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <Text style={{ alignSelf: 'flex-start', color: 'white', flex: 1, fontSize: 16 }}>
        {unseenThreadIds.length} unread threads
      </Text>
      <Reload pathFill={'white'} />
    </TouchableOpacity>
  );
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
