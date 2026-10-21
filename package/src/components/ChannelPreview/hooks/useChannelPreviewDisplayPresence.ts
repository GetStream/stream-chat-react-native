import type { Channel, EventType, StreamChat } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

import { useSyncClientEventsToChannel } from '../../../hooks/useSyncClientEvents';

/**
 * Whether the other member of a two-member channel is online. Returns a primitive so each read of
 * the snapshot is stable.
 */
const selector = (channel: Channel, client: StreamChat) => {
  const members = channel.state.members;
  const membersCount = Object.keys(members).length;
  const otherMember = Object.values(members).find((member) => member.user?.id !== client.userID);

  if (membersCount !== 2) return false;
  return otherMember?.user?.online ?? false;
};

const keys: EventType[] = ['user.presence.changed', 'user.updated'];

/**
 * Whether the avatar of a channel preview shows the online presence indicator.
 *
 * @param channel The channel being previewed.
 * @returns True when the channel has exactly two members and the other one is online.
 */
export function useChannelPreviewDisplayPresence(channel: Channel) {
  const { client } = useChatContext();
  return useSyncClientEventsToChannel({ channel, client, selector, stateChangeEventKeys: keys });
}
