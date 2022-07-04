import type { ChannelResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapChannelInfoToStorable } from '../mappers/mapChannelInfoToStorable';
import { createUpsertQuery } from '../utils/createUpsertQuery';
import { executeQueries } from '../utils/executeQueries';

export const upsertChannelInfo = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channel,
}: {
  channel: ChannelResponse<StreamChatGenerics>;
}) => {
  const query = createUpsertQuery('channels', mapChannelInfoToStorable(channel));
  executeQueries([query]);
};
