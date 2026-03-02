import { Channel, EventTypes, StreamChat } from 'stream-chat';

import { useChatContext } from '../../../contexts';
import { useSyncClientEventsToChannel } from '../../../hooks/useSyncClientEvents';

const selector = (channel: Channel, client: StreamChat) => {
  const members = channel.state.members;
  const onlineMembersCount = Object.values(members).filter(
    (member) => member.user?.id !== client.userID && member.user?.online,
  ).length;

  return onlineMembersCount ?? 0;
};

const keys: EventTypes[] = ['user.presence.changed', 'user.updated'];

export function useChannelOnlineMemberCount(channel: Channel): number;
export function useChannelOnlineMemberCount(channel?: Channel): number | undefined;
export function useChannelOnlineMemberCount(channel?: Channel) {
  const { client } = useChatContext();
  return useSyncClientEventsToChannel({ channel, client, selector, stateChangeEventKeys: keys });
}
