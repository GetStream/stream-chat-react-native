import { useMemo } from 'react';

import type { Channel } from 'stream-chat';

import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useChannelMemberCount } from '../../../hooks/useChannelMemberCount';
import { useIsDirectChat } from '../../../hooks/useIsDirectChat';
import { useChannelMembersState } from '../../ChannelList/hooks/useChannelMembersState';
import { useChannelOnlineMemberCount } from '../../ChannelList/hooks/useChannelOnlineMemberCount';

/**
 * Resolves the status line shown under the channel title: "Online" for a direct chat whose other
 * member is online, an empty string when offline, and the member and online counts for a group.
 *
 * @param channel The channel.
 * @returns The translated status text.
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
      return otherMember?.user?.online ? t('common.presence.online.label', 'Online') : '';
    }
    return t('channelDetails.presence.membersOnline.label', {
      count: memberCount,
      memberCount,
      onlineCount,
      defaultValue_one: '{{memberCount}} member, {{onlineCount}} online',
      defaultValue_other: '{{memberCount}} members, {{onlineCount}} online',
    });
  }, [channel, isDirect, memberCount, members, onlineCount, t]);
};
