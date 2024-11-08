import type { ChannelMemberResponse } from 'stream-chat';

import { selectMembersForChannels } from './queries/selectMembersForChannels';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapStorableToMember } from '../mappers/mapStorableToMember';
import { SqliteClient } from '../SqliteClient';

export const getMembers = async <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channelIds,
}: {
  channelIds: string[];
}) => {
  SqliteClient.logger?.('info', 'getMembers', { channelIds });
  const memberRows = await selectMembersForChannels(channelIds);
  const cidVsMembers: Record<string, ChannelMemberResponse<StreamChatGenerics>[]> = {};
  memberRows.forEach((member) => {
    if (!cidVsMembers[member.cid]) {
      cidVsMembers[member.cid] = [];
    }

    cidVsMembers[member.cid].push(mapStorableToMember<StreamChatGenerics>(member));
  });

  return cidVsMembers;
};
