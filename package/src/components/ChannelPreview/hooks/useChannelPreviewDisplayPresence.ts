import type { Channel } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

/**
 * Hook to set the display avatar presence for channel preview
 * @param {*} channel
 *
 * @returns {boolean} e.g., true
 */
export const useChannelPreviewDisplayPresence = (channel: Channel) => {
  const { client } = useChatContext();
  const members = channel.state.members;
  const membersCount = Object.keys(members).length;

  if (membersCount !== 2) return false;

  const otherMember = Object.values(members).find((member) => member.user?.id !== client.userID);

  return otherMember?.user?.online ?? false;
};
