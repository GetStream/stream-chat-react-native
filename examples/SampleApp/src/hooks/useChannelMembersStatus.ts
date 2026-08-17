import { useMemo } from 'react';

import type { Channel } from 'stream-chat';
import { useTranslationContext } from 'stream-chat-react-native';

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

  const watchersCount = channel.state.watcher_count;
  const memberCount = channel?.data?.member_count ?? 0;

  return useMemo(() => {
    const isOneOnOneConversation = memberCount === 2 && channel.id?.indexOf('!members-') === 0;

    if (isOneOnOneConversation) {
      const other = Object.values({ ...channel.state.members }).find(
        (member) => member.user?.id !== chatClient?.user?.id,
      );

      return getUserActivityStatus(t, other?.user);
    }

    return t('channelDetails.presence.membersOnline.label', {
      count: memberCount,
      memberCount: memberCount > 9 ? '9+' : `${memberCount}`,
      onlineCount: watchersCount > 9 ? '9+' : `${watchersCount}`,
      defaultValue_one: '{{memberCount}} member, {{onlineCount}} online',
      defaultValue_other: '{{memberCount}} members, {{onlineCount}} online',
    });
    // `channel.state` is intentionally not a dependency — it is mutated in place, so it never
    // changes identity. The counts below are what actually move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id, chatClient, memberCount, watchersCount, t]);
};
