import type { ChannelAPIResponse, MessageResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapChannelToStorable } from '../mappers/mapChannelToStorable';
import { mapMemberToStorable } from '../mappers/mapMemberToStorable';
import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { mapReadToStorable } from '../mappers/mapReadToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import type { PreparedQueries } from '../types';
import { createInsertQuery } from '../utils/createInsertQuery';
import { executeQueries } from '../utils/executeQueries';

export const storeChannels = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channels,
  filterAndSort,
}: {
  channels: ChannelAPIResponse<StreamChatGenerics>[];
  filterAndSort?: string;
}) => {
  // Update the database only if the query is provided.
  const queries: PreparedQueries[] = [];
  const usersToUpsert: PreparedQueries[] = [];
  const readsToUpsert: PreparedQueries[] = [];
  const messagesToUpsert: PreparedQueries[] = [];
  const membersToUpsert: PreparedQueries[] = [];
  const reactionsToUpsert: PreparedQueries[] = [];

  if (filterAndSort) {
    const channelIds = channels.map((channel) => channel.channel.cid);
    queries.push(
      createInsertQuery('queryChannelsMap', {
        cids: JSON.stringify(channelIds),
        id: filterAndSort,
      }),
    );
  }

  for (const channel of channels) {
    const { members, messages, read } = channel;
    members.forEach((member) => {
      if (member.user) {
        usersToUpsert.push(createInsertQuery('users', mapUserToStorable(member.user)));
      }

      membersToUpsert.push(
        createInsertQuery(
          'members',
          mapMemberToStorable({
            cid: channel.channel.cid,
            member,
          }),
        ),
      );
    });

    read?.forEach((r) => {
      if (r.user) {
        usersToUpsert.push(createInsertQuery('users', mapUserToStorable(r.user)));
      }

      readsToUpsert.push(
        createInsertQuery(
          'reads',
          mapReadToStorable({
            cid: channel.channel.cid,
            read: r,
          }),
        ),
      );
    });

    queries.push(createInsertQuery('channels', mapChannelToStorable(channel)));
    if (messages !== undefined) {
      messages.forEach((message: MessageResponse<StreamChatGenerics>) => {
        if (message.user) {
          usersToUpsert.push(createInsertQuery('users', mapUserToStorable(message.user)));
        }
        messagesToUpsert.push(createInsertQuery('messages', mapMessageToStorable(message)));
      });

      messages.forEach((message) => {
        [...(message.latest_reactions || []), ...(message.own_reactions || [])].forEach((r) => {
          if (r.user) {
            usersToUpsert.push(createInsertQuery('users', mapUserToStorable(r.user)));
          }

          reactionsToUpsert.push(
            createInsertQuery('reactions', mapReactionToStorable<StreamChatGenerics>(r)),
          );
        });
      });
    }
  }
  queries.push(...membersToUpsert);
  queries.push(...messagesToUpsert);
  queries.push(...reactionsToUpsert);
  queries.push(...readsToUpsert);
  queries.push(...usersToUpsert);

  executeQueries(queries);

  return queries;
};
