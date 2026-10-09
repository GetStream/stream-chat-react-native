import type { ChannelMute, EventType, StreamChat } from 'stream-chat';

import { useChatContext } from '../../../contexts';
import { useSyncClientEvents } from '../../../hooks/useSyncClientEvents';

const selector = (client: StreamChat) => client.mutedChannels;
const keys: EventType[] = ['health.check', 'notification.channel_mutes_updated'];

/**
 * Returns the current user's muted channels.
 */
export const useMutedChannels = (): Array<ChannelMute> => {
  const { client } = useChatContext();
  return useSyncClientEvents({ client, selector, stateChangeEventKeys: keys });
};
