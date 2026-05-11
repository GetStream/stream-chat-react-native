import { useMemo } from 'react';

import type { Channel, ChannelMemberResponse } from 'stream-chat';

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

  return useMemo(() => {
    const all = Object.values(members);
    const total = channel.data?.member_count ?? all.length;
    return {
      hasMore: total > max,
      total,
      visible: all.slice(0, max),
    };
  }, [members, channel.data?.member_count, max]);
};
