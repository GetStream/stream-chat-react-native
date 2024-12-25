import { Channel } from 'stream-chat';
import { DefaultStreamChatGenerics } from '../../../../types/types';

export const isChannelPinned = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
) => {
  if (!channel) return false;

  const member = channel.state.membership;

  return !!member?.pinned_at;
};

export const isChannelArchived = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
) => {
  if (!channel) return false;

  const member = channel.state.membership;

  return !!member?.archived_at;
};
