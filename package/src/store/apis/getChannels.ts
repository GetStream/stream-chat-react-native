import type { DefaultStreamChatGenerics } from 'src/types/types';
import type { ChannelAPIResponse, MessageResponse, ReadResponse } from 'stream-chat';

import { getChannelIdsForQuery } from './queries/getChannelIdsForQuery';

import { getChannelsForChannelIds } from './queries/getChannelsForChannelIds';

import { getMessagesForChannels } from './queries/getMessagesForChannels';
import { getReactionsForMessages } from './queries/getReactionsForMessages';
import { getReadsForChannels } from './queries/getReadsForChannels';

import { mapStorableToMessage } from '../mappers/mapStorableToMessage';
import { mapStorableToRead } from '../mappers/mapStorableToRead';

import type { ReactionRow } from '../types';
import { closeDB } from '../utils/closeDB';
import { openDB } from '../utils/openDB';

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

  // Populate the read states.
  const reads = getReadsForChannels(channelIds);
  const cidVsReads: Record<string, ReadResponse<StreamChatGenerics>[]> = {};
  reads.forEach((read) => {
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
    if (!messageIdVsReactions[reaction.messageId]) {
      messageIdVsReactions[reaction.messageId] = [];
    }
    messageIdVsReactions[reaction.messageId].push(reaction);
  });

  // Populate the messages.
  const cidVsMessages: Record<string, MessageResponse<StreamChatGenerics>[]> = {};
  messages.forEach((m) => {
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
    messages: cidVsMessages[c.channel.cid],
    read: cidVsReads[c.channel.cid],
  }));

  const timeEnd = new Date().getTime();
  console.log('>> PERFORMANCE query 1: getChannels() - time: ', timeEnd - timeStart);
  closeDB();

  return result;
};
