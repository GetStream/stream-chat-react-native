import type { ChannelMemberResponse } from 'stream-chat';

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
    archived_at: archivedAt ? new Date(archivedAt) : undefined,
    banned: Boolean(banned),
    channel_role: channelRole ?? '',
    created_at: new Date(createdAt ?? ''),
    custom: {},
    invite_accepted_at: inviteAcceptedAt ? new Date(inviteAcceptedAt) : undefined,
    invite_rejected_at: inviteRejectedAt ? new Date(inviteRejectedAt) : undefined,
    invited,
    is_moderator: isModerator,
    notifications_muted: false,
    pinned_at: pinnedAt ? new Date(pinnedAt) : undefined,
    role,
    shadow_banned: Boolean(shadowBanned),
    updated_at: new Date(updatedAt ?? ''),
    user: mapStorableToUser(user),
    user_id: userId,
  };
};
