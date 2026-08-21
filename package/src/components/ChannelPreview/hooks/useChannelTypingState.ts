import { Channel } from 'stream-chat';

import { useChannelTypingUsers } from '../../MessageList/hooks/useTypingUsers';

type UseChannelTypingStateProps = {
  channel: Channel;
};

/**
 * Typing users for a channel-preview row. A thin wrapper over the shared `useChannelTypingUsers`
 * core (the same reactive `channel.state.typing` source the in-channel indicator uses). The preview
 * row isn't inside a `<Channel>` provider, so the channel is passed as a prop rather than read from
 * context.
 */
export const useChannelTypingState = ({ channel }: UseChannelTypingStateProps) => {
  const usersTyping = useChannelTypingUsers(channel);

  return { usersTyping };
};
