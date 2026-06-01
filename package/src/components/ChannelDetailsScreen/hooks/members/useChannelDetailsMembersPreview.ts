import { useMemo } from 'react';

import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { useChannelMemberCount } from '../../../../hooks/useChannelMemberCount';
import { useChannelMembersState } from '../../../ChannelList/hooks/useChannelMembersState';

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
  const memberCount = useChannelMemberCount(channel);

  return useMemo(() => {
    const all = Object.values(members);
    const total = memberCount || all.length;
    return {
      hasMore: total > max,
      total,
      visible: all.slice(0, max),
    };
  }, [members, memberCount, max]);
};
