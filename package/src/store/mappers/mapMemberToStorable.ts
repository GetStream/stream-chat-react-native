import type { ChannelMemberResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { MemberRow } from '../types';

export const mapMemberToStorable = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  cid,
  member,
}: {
  cid: string;
  member: ChannelMemberResponse<StreamChatGenerics>;
}): MemberRow => {
  const {
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
  } = member;

  return {
    banned,
    channelRole: channel_role,
    cid,
    createdAt: created_at,
    id: `${cid}-${user_id}`,
    inviteAcceptedAt: invite_accepted_at,
    invited,
    inviteRejectedAt: invite_rejected_at,
    isModerator: is_moderator,
    role,
    shadowBanned: shadow_banned,
    updatedAt: updated_at,
    userId: user_id,
  };
};
