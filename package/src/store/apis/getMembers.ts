import type { ChannelMemberResponse } from 'stream-chat';

import { selectMembersForChannels } from './queries/selectMembersForChannels';

import { mapStorableToMember } from '../mappers/mapStorableToMember';
import { SqliteClient } from '../SqliteClient';

export const getMembers = async ({ channelIds }: { channelIds: string[] }) => {
  SqliteClient.logger?.('info', 'getMembers', { channelIds });
  const memberRows = await selectMembersForChannels(channelIds);
  const cidVsMembers: Record<string, ChannelMemberResponse[]> = {};
  memberRows.forEach((member) => {
    if (!cidVsMembers[member.cid]) {
      cidVsMembers[member.cid] = [];
    }

    cidVsMembers[member.cid].push(mapStorableToMember(member));
  });

  return cidVsMembers;
};
