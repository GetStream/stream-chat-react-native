import type { ChannelAPIResponse, MessageResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapChannelToStorable } from '../mappers/mapChannelToStorable';
import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { mapReadToStorable } from '../mappers/mapReadToStorable';
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
    const { messages, read } = channel;
    read?.forEach((r) => {
      queries.push(
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
      const messagesToUpsert = messages.map((message: MessageResponse<StreamChatGenerics>) =>
        createInsertQuery('messages', mapMessageToStorable(message)),
      );

      const reactionsToUpsert = messages.reduce<PreparedQueries[]>((queriesSoFar, message) => {
        const newQueries = [
          ...(message.latest_reactions || []),
          ...(message.own_reactions || []),
        ].map((r) => createInsertQuery('reactions', mapReactionToStorable<StreamChatGenerics>(r)));
        queriesSoFar.push(...newQueries);

        return queriesSoFar;
      }, []);

      queries.push(...messagesToUpsert);
      queries.push(...reactionsToUpsert);
    }
  }

  executeQueries(queries);

  return queries;
};
