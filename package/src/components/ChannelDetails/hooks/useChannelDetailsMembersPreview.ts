import { useMemo } from 'react';

import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { useChannelMemberCount } from '../../../hooks/useChannelMemberCount';
import { useDisplayedChannelMemberCount } from '../../../hooks/useDisplayedChannelMemberCount';
import { useChannelMembersState } from '../../ChannelList/hooks/useChannelMembersState';

export const DEFAULT_VISIBLE_MEMBER_COUNT = 5;

export type ChannelDetailsMembersPreview = {
  hasMore: boolean;
  total: number;
  visible: ChannelMemberResponse[];
};

export const useChannelDetailsMembersPreview = (
  channel: Channel,
  max: number = DEFAULT_VISIBLE_MEMBER_COUNT,
): ChannelDetailsMembersPreview => {
  const members = useChannelMembersState(channel);
  const displayedMemberCount = useDisplayedChannelMemberCount(channel);
  const memberCount = useChannelMemberCount(channel);

  return useMemo(() => {
    const all = Object.values(members);
    return {
      hasMore: (memberCount || all.length) > max,
      total: memberCount ? displayedMemberCount : all.length,
      visible: all.slice(0, max),
    };
  }, [displayedMemberCount, members, memberCount, max]);
};
