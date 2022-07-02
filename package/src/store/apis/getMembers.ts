import type { ChannelMemberResponse } from 'stream-chat';

import { getMembersForChannels } from './queries/getMembersForChannels';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapStorableToMember } from '../mappers/mapStorableToMember';

export const getMembers = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channelIds: string[],
) => {
  const members = getMembersForChannels(channelIds);
  const cidVsMembers: Record<string, ChannelMemberResponse<StreamChatGenerics>[]> = {};
  members.forEach((member) => {
    if (!cidVsMembers[member.cid]) {
      cidVsMembers[member.cid] = [];
    }

    cidVsMembers[member.cid].push(mapStorableToMember(member));
  });

  return cidVsMembers;
};
