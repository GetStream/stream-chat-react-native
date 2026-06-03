import { useMemo } from 'react';

import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { useChannelMemberCount } from '../../../hooks/useChannelMemberCount';
import { useChannelMembersState } from '../../ChannelList/hooks/useChannelMembersState';

export const DEFAULT_VISIBLE_MEMBER_COUNT = 5;

export type ChannelDetailsMembersPreview = {
  hasMore: boolean;
  total: number;
  visible: ChannelMemberResponse[];
};

/**
 * @experimental This hook is experimental and is subject to change.
 */
export const useChannelDetailsMembersPreview = (
  channel: Channel,
  max: number = DEFAULT_VISIBLE_MEMBER_COUNT,
): ChannelDetailsMembersPreview => {
  const members = useChannelMembersState(channel);
  const memberCount = useChannelMemberCount(channel);

  return useMemo(() => {
    const all = Object.values(members).sort((a, b) => {
      const aCreated = a.created_at;
      const bCreated = b.created_at;
      if (!aCreated) return 1;
      if (!bCreated) return -1;
      return aCreated < bCreated ? -1 : aCreated > bCreated ? 1 : 0;
    });
    const total = memberCount || all.length;
    return {
      hasMore: total > max,
      total,
      visible: all.slice(0, max),
    };
  }, [members, memberCount, max]);
};
