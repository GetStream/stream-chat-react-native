import type { DefaultStreamChatGenerics } from 'src/types/types';
import type {
  ChannelAPIResponse,
  ChannelMemberAPIResponse,
  ChannelMemberResponse,
  MessageResponse,
  ReadResponse,
} from 'stream-chat';

import { getChannelIdsForQuery } from './queries/getChannelIdsForQuery';

import { getChannelsForChannelIds } from './queries/getChannelsForChannelIds';

import { getMembersForChannels } from './queries/getMembersForChannels';
import { getMessagesForChannels } from './queries/getMessagesForChannels';
import { getReactionsForMessages } from './queries/getReactionsForMessages';
import { getReadsForChannels } from './queries/getReadsForChannels';

import { getUsers } from './queries/getUsers';

import { enrichUsers } from './utils/enrichUsers';

import { mapStorableToMember } from '../mappers/mapStorableToMember';
import { mapStorableToMessage } from '../mappers/mapStorableToMessage';
import { mapStorableToRead } from '../mappers/mapStorableToRead';

import type { ReactionRow, UserRow } from '../types';
import { closeDB } from '../utils/closeDB';
import { openDB } from '../utils/openDB';
import { printRow } from '../utils/printRow';

export const getChannels = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  query: string,
): Omit<ChannelAPIResponse<StreamChatGenerics>, 'duration'>[] => {
  if (!query) {
    console.warn('Please provide the query (filters/sort) to fetch channels from DB');
    return [];
  }

  openDB();

  const channelIds = getChannelIdsForQuery(query);
  const channels = getChannelsForChannelIds<StreamChatGenerics>(channelIds);
  // sort the channels as per channel ids
  channels.sort((a, b) => channelIds.indexOf(a.channel.cid) - channelIds.indexOf(b.channel.cid));

  const timeStart = new Date().getTime();

  const userIdsToFetch: string[] = [];

  const members = getMembersForChannels(channelIds);
  const cidVsMembers: Record<string, ChannelMemberResponse<StreamChatGenerics>[]> = {};
  members.forEach((member) => {
    userIdsToFetch.push(member.userId);

    if (!cidVsMembers[member.cid]) {
      cidVsMembers[member.cid] = [];
    }
    cidVsMembers[member.cid].push(mapStorableToMember(member));
  });

  // Populate the read states.
  const reads = getReadsForChannels(channelIds);
  const cidVsReads: Record<string, ReadResponse<StreamChatGenerics>[]> = {};
  reads.forEach((read) => {
    userIdsToFetch.push(read.userId);

    if (!cidVsReads[read.cid]) {
      cidVsReads[read.cid] = [];
    }
    cidVsReads[read.cid].push(mapStorableToRead(read));
  });

  const messages = getMessagesForChannels(channelIds);
  const messageIds = messages.map((m) => m.id);

  // Populate the message reactions.
  const reactions = getReactionsForMessages(messageIds);
  const messageIdVsReactions: Record<string, ReactionRow[]> = {};
  reactions.forEach((reaction) => {
    userIdsToFetch.push(reaction.userId);
    if (!messageIdVsReactions[reaction.messageId]) {
      messageIdVsReactions[reaction.messageId] = [];
    }
    messageIdVsReactions[reaction.messageId].push(reaction);
  });

  // Populate the messages.
  const cidVsMessages: Record<string, MessageResponse<StreamChatGenerics>[]> = {};
  messages.forEach((m) => {
    userIdsToFetch.push(m.userId);
    if (!cidVsMessages[m.cid]) {
      cidVsMessages[m.cid] = [];
    }

    cidVsMessages[m.cid].push(
      mapStorableToMessage({
        messageRow: m,
        reactionRows: messageIdVsReactions[m.id],
      }),
    );
  });

  const result = channels.map((c) => ({
    ...c,
    members: cidVsMembers[c.channel.cid],
    messages: cidVsMessages[c.channel.cid],
    read: cidVsReads[c.channel.cid],
  }));

  const users = getUsers(userIdsToFetch);
  const usersMap: Record<string, UserRow> = {};
  users.forEach((u) => {
    if (!usersMap[u.id]) {
      usersMap[u.id] = u;
    }
  });

  enrichUsers(result, usersMap);
  // console.log(printRow(result))
  const timeEnd = new Date().getTime();
  console.log('>> PERFORMANCE query 1: getChannels() - time: ', timeEnd - timeStart);
  closeDB();

  return result;
};
