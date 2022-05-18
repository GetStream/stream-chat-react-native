import type { ChannelResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { ChannelRow } from '../types';

export const mapChannelInfoToStorable = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: ChannelResponse<StreamChatGenerics>,
): Partial<ChannelRow> => {
  const { cid, id, ...extraData } = channel;

  return {
    cid,
    extraData: JSON.stringify(extraData),
    id,
  };
};
