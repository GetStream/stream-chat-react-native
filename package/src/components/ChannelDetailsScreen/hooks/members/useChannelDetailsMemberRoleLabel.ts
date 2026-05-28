import type { ChannelMemberResponse } from 'stream-chat';

import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';

/**
 * Resolves the trailing role label for a channel member row in the channel details screen.
 *
 * Priority — Owner > Admin > Moderator. When a member matches none of the rules
 * (and no custom `getMemberRoleLabel` is provided on the screen), returns `null`.
 */
export const useChannelDetailsMemberRoleLabel = (member: ChannelMemberResponse): string | null => {
  const { channel, getMemberRoleLabel } = useChannelDetailsContext();
  const { t } = useTranslationContext();

  if (getMemberRoleLabel) {
    return getMemberRoleLabel({ channel, member, t }) ?? null;
  }

  const userId = member.user?.id;
  if (userId && userId === channel?.data?.created_by?.id) {
    return t('Owner');
  }
  if (member.user?.role === 'admin') {
    return t('Admin');
  }
  if (member.channel_role === 'channel_moderator') {
    return t('Moderator');
  }
  return null;
};
