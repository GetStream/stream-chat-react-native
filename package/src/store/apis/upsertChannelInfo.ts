import type { ChannelResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { executeQueries } from '../sqlite-utils/executeQueries';
import { mapChannelInfoToStorable } from '../mappers/mapChannelInfoToStorable';

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
