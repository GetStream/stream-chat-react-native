import { Channel } from 'stream-chat';
import { DefaultStreamChatGenerics } from '../../../../types/types';
import { ChannelListProps } from '../../ChannelList';

/**
 * Returns `true` only if `archived` property is set to `false` within `filters`.
 */
export const shouldConsiderArchivedChannels = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  filters: ChannelListProps<StreamChatGenerics>['filters'],
) => {
  if (!filters) return false;

  return !filters.archived;
};

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
