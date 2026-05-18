import React, { useCallback, useContext, useMemo } from 'react';
import { FlatList } from 'react-native';

import type { ChannelMemberResponse } from 'stream-chat';

import { BottomSheetContext } from '../../../contexts/bottomSheetContext/BottomSheetContext';
import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../../../contexts/utils/defaultBaseContextValue';
import { useChannelMembersState } from '../../ChannelList/hooks/useChannelMembersState';
import { StreamBottomSheetModalFlatList } from '../../UIComponents/StreamBottomSheetModalFlatList';

const keyExtractor = (member: ChannelMemberResponse) => member.user?.id ?? member.user_id ?? '';

/**
 * Renders the full list of channel members.
 *
 * Auto-detects whether a `BottomSheetProvider` is mounted above it: when rendered
 * inside a bottom sheet (the default `ChannelDetailsMemberSection` path), uses
 * `StreamBottomSheetModalFlatList` so scroll is correctly handed off between the
 * list and the surrounding sheet. When rendered standalone (e.g. inside a
 * full-screen route reached via `onViewAllMembersPress`), falls back to a regular
 * `FlatList`.
 */
export const ChannelDetailsMemberList = () => {
  const { channel } = useChannelDetailsContext();
  const { client } = useChatContext();
  const { ChannelDetailsMemberListItem } = useComponentsContext();
  const members = useChannelMembersState(channel);
  const bottomSheetContext = useContext(BottomSheetContext);
  const List =
    bottomSheetContext === DEFAULT_BASE_CONTEXT_VALUE ? FlatList : StreamBottomSheetModalFlatList;

  const data = useMemo(() => Object.values(members), [members]);

  const renderItem = useCallback(
    ({ item }: { item: ChannelMemberResponse }) => (
      <ChannelDetailsMemberListItem isCurrentUser={item.user?.id === client.userID} member={item} />
    ),
    [ChannelDetailsMemberListItem, client.userID],
  );

  return <List data={data} keyExtractor={keyExtractor} renderItem={renderItem} />;
};
