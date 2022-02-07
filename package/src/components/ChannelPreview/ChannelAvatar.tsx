import React from 'react';

import type { ExtendableGenerics } from 'stream-chat';

import type { ChannelPreviewProps } from './ChannelPreview';
import { useChannelPreviewDisplayAvatar } from './hooks/useChannelPreviewDisplayAvatar';
import { useChannelPreviewDisplayPresence } from './hooks/useChannelPreviewDisplayPresence';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { Avatar } from '../Avatar/Avatar';
import { GroupAvatar } from '../Avatar/GroupAvatar';

export type ChannelAvatarProps<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelPreviewProps<StreamChatClient>, 'channel'>;

/**
 * This UI component displays an avatar for a particular channel.
 */
export const ChannelAvatar = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelAvatarProps<StreamChatClient>,
) => {
  const { channel } = props;

  const displayAvatar = useChannelPreviewDisplayAvatar(channel);
  const displayPresence = useChannelPreviewDisplayPresence(channel);

  if (displayAvatar.images) {
    return <GroupAvatar images={displayAvatar.images} names={displayAvatar.names} size={40} />;
  }

  return (
    <Avatar
      image={displayAvatar.image}
      name={displayAvatar.name}
      online={displayPresence}
      size={40}
    />
  );
};
