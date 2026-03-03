import { Channel, EventTypes, Mute, StreamChat } from 'stream-chat';

import { useChatContext } from '../../../contexts';
import { useSyncClientEventsToChannel } from '../../../hooks/useSyncClientEvents';

const selector = (_channel: Channel, client: StreamChat) => client.mutedUsers;
const keys: EventTypes[] = ['health.check', 'notification.mutes_updated'];
export function useMutedUsers(channel: Channel): Array<Mute>;
export function useMutedUsers(channel?: Channel): Array<Mute> | undefined;
export function useMutedUsers(channel?: Channel) {
  const { client } = useChatContext();
  return useSyncClientEventsToChannel({ channel, client, selector, stateChangeEventKeys: keys });
}
