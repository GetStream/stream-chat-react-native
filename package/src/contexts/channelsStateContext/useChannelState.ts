import { useEffect } from 'react';

import type { Channel as ChannelType } from 'stream-chat';

import { useChannelsStateContext } from './ChannelsStateContext';

/**
 * Registers the channel as "active" in the ChannelsStateContext while it is mounted, so the
 * ChannelList's `queryChannels` call can skip re-initializing (and thereby clearing) the state
 * of channels that are currently open — preventing a reconnect race between ChannelList and
 * Channel/Thread. Message and thread-reply state itself now lives in the LLC paginators
 * (`channel.messagePaginator` / `thread.messagePaginator`), not in this context.
 */
export function useChannelState(channel: ChannelType | undefined): void {
  const cid = channel?.id || 'id'; // in case channel is not initialized, use generic id string for indexing
  const { setState } = useChannelsStateContext();

  useEffect(() => {
    setState({ cid, key: 'active', value: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid]);
}
