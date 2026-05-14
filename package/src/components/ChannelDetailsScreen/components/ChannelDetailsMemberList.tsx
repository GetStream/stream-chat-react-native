import React, { useCallback, useMemo } from 'react';

import type { ChannelMemberResponse } from 'stream-chat';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useChannelMembersState } from '../../ChannelList/hooks/useChannelMembersState';
import { StreamBottomSheetModalFlatList } from '../../UIComponents/StreamBottomSheetModalFlatList';

const keyExtractor = (member: ChannelMemberResponse) => member.user?.id ?? member.user_id ?? '';

/**
 * Renders the full list of channel members inside the channel-details bottom sheet.
 *
 * Reads `channel` from `ChannelDetailsContext` and the current user from `ChatContext`,
 * then defers each row to `ChannelDetailsMemberListItem` (resolved via the components
 * context so it remains overridable). Uses `StreamBottomSheetModalFlatList` so scroll
 * is correctly handed off between the list and the surrounding bottom sheet.
 */
export const ChannelDetailsMemberList = () => {
  const { channel } = useChannelDetailsContext();
  const { client } = useChatContext();
  const { ChannelDetailsMemberListItem } = useComponentsContext();
  const members = useChannelMembersState(channel);

  const data = useMemo(() => Object.values(members), [members]);

  const renderItem = useCallback(
    ({ item }: { item: ChannelMemberResponse }) => (
      <ChannelDetailsMemberListItem isCurrentUser={item.user?.id === client.userID} member={item} />
    ),
    [ChannelDetailsMemberListItem, client.userID],
  );

  return (
    <StreamBottomSheetModalFlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
    />
  );
};
