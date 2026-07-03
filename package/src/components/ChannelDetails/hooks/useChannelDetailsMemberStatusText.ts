import { useMemo } from 'react';

import type { Channel } from 'stream-chat';

import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useChannelMemberCount } from '../../../hooks/useChannelMemberCount';
import { useIsDirectChat } from '../../../hooks/useIsDirectChat';
import { useChannelMembersState } from '../../ChannelList/hooks/useChannelMembersState';
import { useChannelOnlineMemberCount } from '../../ChannelList/hooks/useChannelOnlineMemberCount';

/**
 * Resolves the subtitle status line shown under the channel title.
 *   - Direct chats: `t('Online')` when the other member is online, otherwise an empty string.
 *   - Group chats: `t('{{memberCount}} members, {{onlineCount}} online')`.
 */
export const useChannelDetailsMemberStatusText = (channel: Channel): string => {
  const { t } = useTranslationContext();
  const members = useChannelMembersState(channel);
  const memberCount = useChannelMemberCount(channel);
  const onlineCount = useChannelOnlineMemberCount(channel);
  const isDirect = useIsDirectChat(channel);

  return useMemo(() => {
    if (isDirect) {
      const ownUserId = channel.getClient().userID;
      const otherMember = Object.values(members).find((member) => member.user?.id !== ownUserId);
      return otherMember?.user?.online ? t('Online') : '';
    }
    return t('{{memberCount}} members, {{onlineCount}} online', {
      count: memberCount,
      memberCount,
      onlineCount,
    });
  }, [channel, isDirect, memberCount, members, onlineCount, t]);
};
