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
    archived_at: archivedAt,
    banned,
    channel_role: channelRole,
    created_at: createdAt,
    invite_accepted_at: inviteAcceptedAt,
    invite_rejected_at: inviteRejectedAt,
    invited,
    is_moderator: isModerator,
    pinned_at: pinnedAt,
    role,
    shadow_banned: shadowBanned,
    updated_at: updatedAt,
    user: mapStorableToUser(user),
    user_id: userId,
  };
};
