import type { ChannelMemberResponse } from 'stream-chat';

import { mapTimestampToStorable } from './mapTimestampToStorable';

import type { TableRow } from '../types';

export const mapMemberToStorable = ({
  cid,
  member,
}: {
  cid: string;
  member: ChannelMemberResponse;
}): TableRow<'members'> => {
  const {
    archived_at,
    banned,
    channel_role,
    created_at,
    invite_accepted_at,
    invite_rejected_at,
    invited,
    is_moderator,
    role,
    shadow_banned,
    updated_at,
    user_id,
    pinned_at,
  } = member;

  return {
    archivedAt: mapTimestampToStorable(archived_at),
    banned,
    channelRole: channel_role,
    cid,
    createdAt: mapTimestampToStorable(created_at),
    inviteAcceptedAt: mapTimestampToStorable(invite_accepted_at),
    invited,
    inviteRejectedAt: mapTimestampToStorable(invite_rejected_at),
    isModerator: is_moderator,
    pinnedAt: mapTimestampToStorable(pinned_at),
    role,
    shadowBanned: shadow_banned,
    updatedAt: mapTimestampToStorable(updated_at),
    userId: user_id,
  };
};
