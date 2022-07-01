import type { ChannelAPIResponse, MessageResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapChannelToStorable } from '../mappers/mapChannelToStorable';
import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { createInsertQuery } from '../utils/createInsertQuery';
import { executeQueries } from '../utils/executeQueries';

export const storeChannel = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channel,
}: {
  channel: ChannelAPIResponse<StreamChatGenerics>;
}) => {
  const queries = [createInsertQuery('channels', mapChannelToStorable(channel))];
  const { messages } = channel;

  if (messages !== undefined) {
    const messagesToUpsert = messages.map((message: MessageResponse<StreamChatGenerics>) =>
      createInsertQuery('messages', mapMessageToStorable(message)),
    );
    queries.push(...messagesToUpsert);
  }

  executeQueries(queries);
};
