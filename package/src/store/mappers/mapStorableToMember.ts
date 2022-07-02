import type { ChannelAPIResponse, ChannelMemberResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { ChannelRow, MemberRow } from '../types';

export const mapStorableToMember = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  memberRow: MemberRow,
): ChannelMemberResponse<StreamChatGenerics> => {
  const {
    banned,
    channelRole,
    createdAt,
    inviteAcceptedAt,
    invited,
    inviteRejectedAt,
    isModerator,
    role,
    shadowBanned,
    updatedAt,
    userId,
  } = memberRow;

  return {
    banned,
    channel_role: channelRole,
    created_at: createdAt,
    invite_accepted_at: inviteAcceptedAt,
    invite_rejected_at: inviteRejectedAt,
    invited,
    is_moderator: isModerator,
    role,
    shadow_banned: shadowBanned,
    updated_at: updatedAt,
    user_id: userId,
  };
};
