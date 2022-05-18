import type { ChannelResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapChannelInfoToStorable } from '../mappers/mapChannelInfoToStorable';
import { createInsertQuery } from '../utils/createInsertQuery';
import { executeQueries } from '../utils/executeQueries';

export const storeChannelInfo = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channel,
}: {
  channel: ChannelResponse<StreamChatGenerics>;
}) => {
  const query = createInsertQuery('channels', mapChannelInfoToStorable(channel));
  executeQueries([query]);
};
