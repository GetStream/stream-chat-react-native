import { Channel, EventTypes } from 'stream-chat';

import { useChatContext } from '../../../contexts';
import { useSyncClientEventsToChannel } from '../../../hooks/useSyncClientEvents';

const selector = (channel: Channel) => {
  return channel.state.watcher_count ?? 0;
};

const keys: EventTypes[] = ['user.watching.start', 'user.watching.stop'];

export function useChannelOnlineMemberCount(channel: Channel): number;
export function useChannelOnlineMemberCount(channel?: Channel): number | undefined;
export function useChannelOnlineMemberCount(channel?: Channel) {
  const { client } = useChatContext();
  return useSyncClientEventsToChannel({ channel, client, selector, stateChangeEventKeys: keys });
}
