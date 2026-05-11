import { useMemo } from 'react';

import type { Channel } from 'stream-chat';

import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useChannelMembersState } from '../../ChannelList/hooks/useChannelMembersState';
import { useChannelOnlineMemberCount } from '../../ChannelList/hooks/useChannelOnlineMemberCount';

export const useChannelDetailsMemberStatusText = (channel: Channel): string => {
  const { t } = useTranslationContext();
  const members = useChannelMembersState(channel);
  const onlineCount = useChannelOnlineMemberCount(channel);

  return useMemo(() => {
    const memberCount = channel.data?.member_count ?? Object.keys(members).length;
    return t('{{memberCount}} members, {{onlineCount}} online', {
      count: memberCount,
      memberCount,
      onlineCount,
    });
  }, [channel.data?.member_count, members, onlineCount, t]);
};
