import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import type { TranslationContextValue } from '../../../../contexts/translationContext/TranslationContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';

/**
 * A single role shown next to a member row.
 *
 * - `key` is the raw role identifier (`'owner'`, `'admin'`, `'moderator'`, …).
 * - `label` is the translated, user-facing text.
 */
export type RoleLabel = {
  key: string;
  label: string;
};

/**
 * Override the roles shown next to each member in the channel details screen.
 *
 * Receives `defaultRoleLabels` — the roles the default implementation computed for this member —
 * so a custom implementation can reuse or extend them (e.g. `[...defaultRoleLabels, customRole]`),
 * and returns the list of roles to render (or an empty array to render none). The default
 * implementation marks members as `owner` (channel creator), `admin` (`user.role === 'admin'`)
 * and `moderator` (`channel_role === 'channel_moderator'`), returning every role that applies.
 */
export type GetMemberRoles = (params: {
  channel: Channel;
  defaultRoleLabels: RoleLabel[];
  member: ChannelMemberResponse;
  t: TranslationContextValue['t'];
}) => RoleLabel[];

/**
 * Resolves the trailing role badges for a channel member row in the channel details screen.
 *
 * Returns every applicable role in the order Owner > Admin > Moderator. When a member matches
 * none of the rules (and no custom `getMemberRoles` is provided), returns an empty array.
 * @experimental This hook is experimental and is subject to change.
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
    defaultRoleLabels.push({ key: 'owner', label: t('Owner') });
  }
  if (member.user?.role === 'admin') {
    defaultRoleLabels.push({ key: 'admin', label: t('Admin') });
  }
  if (member.channel_role === 'channel_moderator') {
    defaultRoleLabels.push({ key: 'moderator', label: t('Moderator') });
  }

  if (getMemberRoles) {
    return getMemberRoles({ channel, defaultRoleLabels, member, t }) ?? [];
  }
  return defaultRoleLabels;
};
