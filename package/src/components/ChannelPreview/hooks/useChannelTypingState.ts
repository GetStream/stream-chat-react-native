import { Channel } from 'stream-chat';

import { useChannelTypingUsers } from '../../MessageList/hooks/useTypingUsers';

type UseChannelTypingStateProps = {
  channel: Channel;
};

/**
 * The users typing in a channel preview row. The channel is a parameter because the row renders
 * outside a `<Channel>` provider.
 *
 * @param params.channel The channel being previewed.
 * @returns The typing users as `usersTyping`.
 */
export const useChannelTypingState = ({ channel }: UseChannelTypingStateProps) => {
  const usersTyping = useChannelTypingUsers(channel);

  return { usersTyping };
};
