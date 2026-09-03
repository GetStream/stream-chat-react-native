import type { ChannelMemberResponse } from 'stream-chat';

import { mapStorableToTimestamp } from './mapStorableToTimestamp';
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
    archived_at: mapStorableToTimestamp(archivedAt),
    banned: Boolean(banned),
    channel_role: channelRole ?? '',
    created_at: mapStorableToTimestamp(createdAt) ?? 0,
    custom: {},
    invite_accepted_at: mapStorableToTimestamp(inviteAcceptedAt),
    invite_rejected_at: mapStorableToTimestamp(inviteRejectedAt),
    invited,
    is_moderator: isModerator,
    notifications_muted: false,
    pinned_at: mapStorableToTimestamp(pinnedAt),
    role,
    shadow_banned: Boolean(shadowBanned),
    updated_at: mapStorableToTimestamp(updatedAt) ?? 0,
    user: mapStorableToUser(user),
    user_id: userId,
  };
};
