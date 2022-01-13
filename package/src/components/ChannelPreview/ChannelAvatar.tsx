import React from 'react';

import type { ChannelPreviewProps } from './ChannelPreview';
import { useChannelPreviewDisplayAvatar } from './hooks/useChannelPreviewDisplayAvatar';
import { useChannelPreviewDisplayPresence } from './hooks/useChannelPreviewDisplayPresence';

import type { StreamChatGenerics } from '../../types/types';
import { Avatar } from '../Avatar/Avatar';
import { GroupAvatar } from '../Avatar/GroupAvatar';

export type ChannelAvatarProps<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Pick<ChannelPreviewProps<At, Ch, Co, Ev, Me, Re, Us>, 'channel'>;

/**
 * This UI component displays an avatar for a particular channel.
 */
export const ChannelAvatar = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: ChannelAvatarProps<At, Ch, Co, Ev, Me, Re, Us>,
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
