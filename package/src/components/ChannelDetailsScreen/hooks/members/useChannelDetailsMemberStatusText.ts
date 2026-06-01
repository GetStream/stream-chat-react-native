import { useMemo } from 'react';

import type { Channel } from 'stream-chat';

import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { useChannelMemberCount } from '../../../../hooks/useChannelMemberCount';
import { useChannelMembersState } from '../../../ChannelList/hooks/useChannelMembersState';
import { useChannelOnlineMemberCount } from '../../../ChannelList/hooks/useChannelOnlineMemberCount';

export const useChannelDetailsMemberStatusText = (channel: Channel): string => {
  const { t } = useTranslationContext();
  const members = useChannelMembersState(channel);
  const reactiveMemberCount = useChannelMemberCount(channel);
  const onlineCount = useChannelOnlineMemberCount(channel);

  return useMemo(() => {
    const memberCount = reactiveMemberCount || Object.keys(members).length;
    return t('{{memberCount}} members, {{onlineCount}} online', {
      count: memberCount,
      memberCount,
      onlineCount,
    });
  }, [reactiveMemberCount, members, onlineCount, t]);
};
