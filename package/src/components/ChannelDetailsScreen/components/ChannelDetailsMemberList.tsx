import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';

import type { ChannelMemberResponse } from 'stream-chat';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useChannelAllMembers } from '../hooks/useChannelAllMembers';

const keyExtractor = (member: ChannelMemberResponse) => member.user?.id ?? member.user_id ?? '';

/**
 * Lists all channel members.
 */
export const ChannelDetailsMemberList = () => {
  const { channel } = useChannelDetailsContext();
  const { client } = useChatContext();
  const { ChannelDetailsMemberListItem } = useComponentsContext();
  const { hasMore, loadingMore, loadMore, results } = useChannelAllMembers({ channel });

  const renderItem = useCallback(
    ({ item }: { item: ChannelMemberResponse }) => (
      <ChannelDetailsMemberListItem isCurrentUser={item.user?.id === client.userID} member={item} />
    ),
    [ChannelDetailsMemberListItem, client.userID],
  );

  const ListFooterComponent = useMemo(
    () =>
      loadingMore ? <ActivityIndicator testID='channel-details-member-list-loading-more' /> : null,
    [loadingMore],
  );

  return (
    <FlatList
      data={results}
      keyExtractor={keyExtractor}
      ListFooterComponent={ListFooterComponent}
      onEndReached={hasMore ? loadMore : undefined}
      onEndReachedThreshold={0.5}
      renderItem={renderItem}
    />
  );
};
