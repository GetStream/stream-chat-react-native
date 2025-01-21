import React from 'react';

import type { ChannelPreviewProps } from './ChannelPreview';
import { useChannelPreviewDisplayAvatar } from './hooks/useChannelPreviewDisplayAvatar';
import { useChannelPreviewDisplayPresence } from './hooks/useChannelPreviewDisplayPresence';

import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { Avatar } from '../Avatar/Avatar';
import { GroupAvatar } from '../Avatar/GroupAvatar';

export type ChannelAvatarProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelPreviewProps<StreamChatGenerics>, 'channel'> & {
  /**
   * The size of the avatar.
   */
  size?: number;
};

/**
 * This UI component displays an avatar for a particular channel.
 */
export const ChannelAvatarWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelAvatarProps<StreamChatGenerics> & Pick<ChatContextValue, 'ImageComponent'>,
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

export const ChannelAvatar = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelAvatarProps<StreamChatGenerics>,
) => {
  const { ImageComponent } = useChatContext<StreamChatGenerics>();

  return <ChannelAvatarWithContext {...props} ImageComponent={ImageComponent} />;
};
