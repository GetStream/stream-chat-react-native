import { Channel, EventTypes, Mute, StreamChat } from 'stream-chat';

import { useChatContext } from '../../../contexts';
import { useSyncClientEvents } from '../../../hooks/useSyncClientEvents';

const selector = (client: StreamChat) => client.mutedUsers;
const keys: EventTypes[] = ['health.check', 'notification.mutes_updated'];

/**
 *
 * @param @deprecated _channel - This parameter is deprecated because it is no longer necessary. It is kept for backwards compatibility only..
 * @returns
 */
export function useMutedUsers(_channel?: Channel): Array<Mute> {
  const { client } = useChatContext();
  return useSyncClientEvents({ client, selector, stateChangeEventKeys: keys });
}
