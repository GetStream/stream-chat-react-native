import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, type FlatListProps } from 'react-native';

import type { ChannelMemberResponse } from 'stream-chat';

import { MemberListLoadingSkeleton } from './MemberListLoadingSkeleton';

import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useChannelAllMembers } from '../../hooks/members/useChannelAllMembers';

const keyExtractor = (member: ChannelMemberResponse) => member.user?.id ?? member.user_id ?? '';

export type ChannelMemberListProps = {
  /**
   * Besides the existing default behavior of the members list, you can attach
   * additional props to the underlying React Native FlatList.
   *
   * See https://reactnative.dev/docs/flatlist#props for the full list.
   */
  additionalFlatListProps?: Partial<FlatListProps<ChannelMemberResponse>>;
};

/**
 * Lists all channel members.
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelMemberList = ({ additionalFlatListProps }: ChannelMemberListProps = {}) => {
  const { channel, onMemberPress } = useChannelDetailsContext();
  const { ChannelMemberActionsSheet, ChannelMemberItem } = useComponentsContext();
  const { hasMore, loading, loadingMore, loadMore, results } = useChannelAllMembers({ channel });
  const [selectedMember, setSelectedMember] = useState<ChannelMemberResponse | null>(null);

  const handleMemberActionsClose = useCallback(() => setSelectedMember(null), []);

  const handleMemberPress = useCallback(
    (member: ChannelMemberResponse) => {
      if (onMemberPress) {
        onMemberPress(member);
        return;
      }
      setSelectedMember(member);
    },
    [onMemberPress],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChannelMemberResponse }) => (
      <ChannelMemberItem member={item} onPress={handleMemberPress} />
    ),
    [ChannelMemberItem, handleMemberPress],
  );

  const ListFooterComponent = useMemo(
    () => (loadingMore ? <ActivityIndicator /> : null),
    [loadingMore],
  );

  if (loading && results.length === 0) {
    return <MemberListLoadingSkeleton />;
  }

  return (
    <>
      <FlatList
        data={results}
        keyExtractor={keyExtractor}
        ListFooterComponent={ListFooterComponent}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.2}
        renderItem={renderItem}
        {...additionalFlatListProps}
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
