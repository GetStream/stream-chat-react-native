import type { Channel } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

/**
 * Hook to set the display avatar presence for channel preview
 * @param {*} channel
 *
 * @returns {boolean} e.g., true
 */
export const useChannelPreviewDisplayPresence = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
) => {
  const { client } = useChatContext<StreamChatGenerics>();
  const members = channel.state.members;
  const membersCount = Object.keys(members).length;

  if (membersCount !== 2) return false;

  const otherMember = Object.values(members).find((member) => member.user?.id !== client.userID);

  return otherMember?.user?.online ?? false;
};
