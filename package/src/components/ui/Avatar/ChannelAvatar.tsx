import React from 'react';

import { Channel, UserResponse } from 'stream-chat';

import { Avatar } from './Avatar';

import { UserAvatarGroup } from './AvatarGroup';

import { useChannelPreviewDisplayPresence } from '../../../components/ChannelPreview/hooks/useChannelPreviewDisplayPresence';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { hashStringToNumber } from '../../../utils/utils';

export type ChannelAvatarProps = {
  channel: Channel;
  showOnlineIndicator?: boolean;
  size: 'xs' | 'sm' | 'md' | 'lg';
  showBorder?: boolean;
};

export const ChannelAvatar = (props: ChannelAvatarProps) => {
  const { channel } = props;
  const members = Object.values(channel.state.members);
  const online = useChannelPreviewDisplayPresence(channel);
  const { showOnlineIndicator = online } = props;

  const {
    theme: { semantics },
  } = useTheme();

  const hashedValue = hashStringToNumber(channel.cid);
  const index = ((hashedValue % 5) + 1) as 1 | 2 | 3 | 4 | 5;
  const avatarBackgroundColor = semantics[`avatarPaletteBg${index}`];

  const { size, showBorder = true } = props;

  const channelImage = undefined;

  if (!channelImage) {
    return (
      <UserAvatarGroup
        size='lg'
        users={members.map((member) => member.user as UserResponse)}
        showOnlineIndicator={showOnlineIndicator}
      />
    );
  }

  return (
    <Avatar
      backgroundColor={avatarBackgroundColor}
      imageUrl={channelImage}
      showBorder={showBorder}
      size={size}
    />
  );
};
