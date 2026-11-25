import { useMemo } from 'react';

import type { Channel } from 'stream-chat';
import {
  useChannelMemberCount,
  useChannelMembersState,
  useChannelOnlineMemberCount,
  useDisplayedChannelMemberCount,
  useTranslationContext,
} from 'stream-chat-react-native';

import { useAppContext } from '../context/AppContext';
import { getUserActivityStatus } from '../utils/getUserActivityStatus';

/**
 * Subtitle for the channel header: either the other person's presence, or "N members, M online".
 *
 * The member/online wording reuses the SDK's own key instead of a template literal, so it is
 * already translated for every language registered in `src/i18n` and pluralises correctly.
 */
export const useChannelMembersStatus = (channel: Channel) => {
  const { t } = useTranslationContext();
  const { chatClient } = useAppContext();

  const members = useChannelMembersState(channel);
  const memberCount = useChannelMemberCount(channel);
  const displayedMemberCount = useDisplayedChannelMemberCount(channel);
  const onlineCount = useChannelOnlineMemberCount(channel);

  return useMemo(() => {
    const isOneOnOneConversation = memberCount === 2 && channel.id?.indexOf('!members-') === 0;

    if (isOneOnOneConversation) {
      const other = Object.values(members).find(
        (member) => member.user?.id !== chatClient?.user?.id,
      );

      return getUserActivityStatus(t, other?.user);
    }

    return t('channelDetails.presence.membersOnline.label', {
      count: displayedMemberCount,
      memberCount: displayedMemberCount > 9 ? '9+' : `${displayedMemberCount}`,
      onlineCount: onlineCount > 9 ? '9+' : `${onlineCount}`,
      defaultValue_one: '{{memberCount}} member, {{onlineCount}} online',
      defaultValue_other: '{{memberCount}} members, {{onlineCount}} online',
    });
  }, [channel.id, chatClient, displayedMemberCount, memberCount, members, onlineCount, t]);
};
