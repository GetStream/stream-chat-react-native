import React from 'react';

import type { ChannelPreviewProps } from './ChannelPreview';
import { useChannelPreviewDisplayAvatar } from './hooks/useChannelPreviewDisplayAvatar';
import { useChannelPreviewDisplayPresence } from './hooks/useChannelPreviewDisplayPresence';

import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import { Avatar } from '../Avatar/Avatar';
import { GroupAvatar } from '../Avatar/GroupAvatar';

export type ChannelAvatarProps = Pick<ChannelPreviewProps, 'channel'> & {
  /**
   * The size of the avatar.
   */
  size?: number;
};

/**
 * This UI component displays an avatar for a particular channel.
 */
export const ChannelAvatarWithContext = (
  props: ChannelAvatarProps & Pick<ChatContextValue, 'ImageComponent'>,
) => {
  const { channel, ImageComponent, size: propSize } = props;
  const {
    theme: {
      channelPreview: {
        avatar: { size: themeSize },
      },
    },
  } = useTheme();

  const size = propSize || themeSize;

  const displayAvatar = useChannelPreviewDisplayAvatar(channel);
  const displayPresence = useChannelPreviewDisplayPresence(channel);

  if (displayAvatar.images) {
    return (
      <GroupAvatar
        ImageComponent={ImageComponent}
        images={displayAvatar.images}
        names={displayAvatar.names}
        size={size}
      />
    );
  }

  return (
    <Avatar
      image={displayAvatar.image}
      ImageComponent={ImageComponent}
      name={displayAvatar.name}
      online={displayPresence}
      size={size}
    />
  );
};

export const ChannelAvatar = (props: ChannelAvatarProps) => {
  const { ImageComponent } = useChatContext();

  return <ChannelAvatarWithContext {...props} ImageComponent={ImageComponent} />;
};
