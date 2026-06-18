import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import type { TranslationContextValue } from '../../../../contexts/translationContext/TranslationContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';

/**
 * Override the role label shown next to each member in the channel details screen.
 *
 * The default implementation labels members as `Owner` (channel creator),
 * `Admin` (`user.role === 'admin'`), or `Moderator` (`channel_role === 'channel_moderator'`),
 * with priority Owner > Admin > Moderator. Return `null` to render no label.
 */
export type GetMemberRoleLabel = (params: {
  channel: Channel;
  member: ChannelMemberResponse;
  t: TranslationContextValue['t'];
}) => string | null | undefined;

/**
 * Resolves the trailing role label for a channel member row in the channel details screen.
 *
 * Priority — Owner > Admin > Moderator. When a member matches none of the rules
 * (and no custom `getMemberRoleLabel` is provided), returns `null`.
 * @experimental This hook is experimental and is subject to change.
 */
export const useMemberRoleLabel = (
  member: ChannelMemberResponse,
  getMemberRoleLabel?: GetMemberRoleLabel,
): string | null => {
  const { channel } = useChannelDetailsContext();
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
