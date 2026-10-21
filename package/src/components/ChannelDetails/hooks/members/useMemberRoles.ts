import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import type { TranslationContextValue } from '../../../../contexts/translationContext/TranslationContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';

/**
 * A role shown next to a member row. `key` is the role identifier (`'owner'`, `'admin'`,
 * `'moderator'`, ...) and `label` the translated text.
 */
export type RoleLabel = {
  key: string;
  label: string;
};

/**
 * Overrides the roles shown next to each member. Receives the `defaultRoleLabels` computed for the
 * member, to reuse or extend, and returns the roles to render, or an empty array for none. The
 * defaults are `owner` (channel creator), `admin` (`user.role === 'admin'`) and `moderator`
 * (`channel_role === 'channel_moderator'`).
 */
export type GetMemberRoles = (params: {
  channel: Channel;
  defaultRoleLabels: RoleLabel[];
  member: ChannelMemberResponse;
  t: TranslationContextValue['t'];
}) => RoleLabel[];

/**
 * Resolves the role badges of a channel member row, in the order Owner, Admin, Moderator.
 *
 * @param member The channel member.
 * @param getMemberRoles Overrides the default roles.
 * @returns The roles, or an empty array when none apply.
 */
export const useMemberRoles = (
  member: ChannelMemberResponse,
  getMemberRoles?: GetMemberRoles,
): RoleLabel[] => {
  const { channel } = useChannelDetailsContext();
  const { t } = useTranslationContext();

  const defaultRoleLabels: RoleLabel[] = [];
  const userId = member.user?.id;
  if (userId && userId === channel?.data?.created_by?.id) {
    defaultRoleLabels.push({
      key: 'owner',
      label: t('channelDetails.memberRoles.owner.label', 'Owner'),
    });
  }
  if (member.user?.role === 'admin') {
    defaultRoleLabels.push({
      key: 'admin',
      label: t('channelDetails.memberRoles.admin.label', 'Admin'),
    });
  }
  if (member.channel_role === 'channel_moderator') {
    defaultRoleLabels.push({
      key: 'moderator',
      label: t('channelDetails.memberRoles.moderator.label', 'Moderator'),
    });
  }

  if (getMemberRoles) {
    return getMemberRoles({ channel, defaultRoleLabels, member, t }) ?? [];
  }
  return defaultRoleLabels;
};
