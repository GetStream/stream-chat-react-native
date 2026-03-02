import { Channel, ChannelMute, EventTypes, StreamChat } from 'stream-chat';

import { useChatContext } from '../../../contexts';
import { useSyncClientEventsToChannel } from '../../../hooks/useSyncClientEvents';

const selector = (_channel: Channel, client: StreamChat) => client.mutedChannels;
const keys: EventTypes[] = [
  'health.check',
  'notification.channel_mutes_updated',
  'channel.muted',
  'channel.unmuted',
];
export function useMutedChannels(channel: Channel): Array<ChannelMute>;
export function useMutedChannels(channel?: Channel): Array<ChannelMute> | undefined;
export function useMutedChannels(channel?: Channel) {
  const { client } = useChatContext();
  return useSyncClientEventsToChannel({ channel, client, selector, stateChangeEventKeys: keys });
}
