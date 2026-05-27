import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';

import type { ChannelMemberResponse } from 'stream-chat';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useStableCallback } from '../../../hooks/useStableCallback';
import { useChannelAllMembers } from '../hooks/useChannelAllMembers';

const keyExtractor = (member: ChannelMemberResponse) => member.user?.id ?? member.user_id ?? '';

/**
 * Lists all channel members.
 */
export const ChannelMemberList = () => {
  const { channel, onMemberPress } = useChannelDetailsContext();
  const { client } = useChatContext();
  const { ChannelMemberActionsSheet, ChannelMemberItem } = useComponentsContext();
  const { hasMore, loadingMore, loadMore, results } = useChannelAllMembers({ channel });
  const [selectedMember, setSelectedMember] = useState<ChannelMemberResponse | null>(null);

  const handleMemberActionsClose = useStableCallback(() => setSelectedMember(null));

  const handleMemberPress = useStableCallback((member: ChannelMemberResponse) => {
    if (onMemberPress) {
      onMemberPress(member);
      return;
    }
    setSelectedMember(member);
  });

  const renderItem = useCallback(
    ({ item }: { item: ChannelMemberResponse }) => (
      <ChannelMemberItem
        isCurrentUser={item.user?.id === client.userID}
        member={item}
        onPress={() => handleMemberPress(item)}
      />
    ),
    [ChannelMemberItem, client.userID, handleMemberPress],
  );

  const ListFooterComponent = useMemo(
    () => (loadingMore ? <ActivityIndicator /> : null),
    [loadingMore],
  );

  return (
    <>
      <FlatList
        data={results}
        keyExtractor={keyExtractor}
        ListFooterComponent={ListFooterComponent}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.2}
        renderItem={renderItem}
      />
      {selectedMember ? (
        <ChannelMemberActionsSheet
          member={selectedMember}
          onClose={handleMemberActionsClose}
          visible
        />
      ) : null}
    </>
  );
};
