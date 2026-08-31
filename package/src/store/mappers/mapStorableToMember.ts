import type { ChannelMemberResponse } from 'stream-chat';

import { mapStorableToDateTime } from './mapStorableToDateTime';
import { mapStorableToUser } from './mapStorableToUser';

import type { TableRowJoinedUser } from '../types';

export const mapStorableToMember = (
  memberRow: TableRowJoinedUser<'members'>,
): ChannelMemberResponse => {
  const {
    archivedAt,
    banned,
    channelRole,
    createdAt,
    inviteAcceptedAt,
    invited,
    inviteRejectedAt,
    isModerator,
    pinnedAt,
    role,
    shadowBanned,
    updatedAt,
    user,
    userId,
  } = memberRow;

  return {
    archived_at: mapStorableToDateTime(archivedAt),
    banned: Boolean(banned),
    channel_role: channelRole ?? '',
    created_at: mapStorableToDateTime(createdAt) ?? 0,
    custom: {},
    invite_accepted_at: mapStorableToDateTime(inviteAcceptedAt),
    invite_rejected_at: mapStorableToDateTime(inviteRejectedAt),
    invited,
    is_moderator: isModerator,
    notifications_muted: false,
    pinned_at: mapStorableToDateTime(pinnedAt),
    role,
    shadow_banned: Boolean(shadowBanned),
    updated_at: mapStorableToDateTime(updatedAt) ?? 0,
    user: mapStorableToUser(user),
    user_id: userId,
  };
};
