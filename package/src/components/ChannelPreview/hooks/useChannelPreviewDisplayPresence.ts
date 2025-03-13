import type { Channel, EventTypes, StreamChat } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

import { useSyncClientEventsToChannel } from '../../../hooks/useSyncClientEvents';
import type { DefaultStreamChatGenerics } from '../../../types/types';

/**
 * Selector to get the display avatar presence for channel preview
 * @param channel
 * @param client
 * @returns boolean
 *
 * NOTE: If you want to listen to the value changes where you call the hook, the selector should return primitive values instead of object.
 */
const selector = <StreamChatGenerics extends DefaultStreamChatGenerics>(
  channel: Channel<StreamChatGenerics>,
  client: StreamChat<StreamChatGenerics>,
) => {
  const members = channel.state.members;
  const membersCount = Object.keys(members).length;
  const otherMember = Object.values(members).find((member) => member.user?.id !== client.userID);

  if (membersCount !== 2) return false;
  return otherMember?.user?.online ?? false;
};

const keys: EventTypes[] = ['user.presence.changed', 'user.updated'];

/**
 * Hook to set the display avatar presence for channel preview
 * @param {*} channel
 *
 * @returns {boolean} e.g., true
 */
export function useChannelPreviewDisplayPresence<
  StreamChatGenerics extends DefaultStreamChatGenerics,
>(channel: Channel<StreamChatGenerics>) {
  const { client } = useChatContext<StreamChatGenerics>();
  return useSyncClientEventsToChannel({ channel, client, selector, stateChangeEventKeys: keys });
}
