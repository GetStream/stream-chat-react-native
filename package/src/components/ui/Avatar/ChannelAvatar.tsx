import React, { useMemo } from 'react';

import { Channel, UserResponse } from 'stream-chat';

import { Avatar } from './Avatar';

import { UserAvatarGroup } from './AvatarGroup';

import { UserAvatar } from './UserAvatar';

import { useChannelPreviewDisplayPresence } from '../../../components/ChannelPreview/hooks/useChannelPreviewDisplayPresence';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { hashStringToNumber } from '../../../utils/utils';

export type ChannelAvatarProps = {
  channel: Channel;
  showOnlineIndicator?: boolean;
  size?: 'lg' | 'xl' | '2xl';
  showBorder?: boolean;
};

export const ChannelAvatar = (props: ChannelAvatarProps) => {
  const { client } = useChatContext();
  const { channel } = props;
  const online = useChannelPreviewDisplayPresence(channel);
  const { showOnlineIndicator = online, size = 'xl', showBorder = true } = props;

  const {
    theme: { semantics },
  } = useTheme();

  const hashedValue = hashStringToNumber(channel.cid);
  const index = ((hashedValue % 5) + 1) as 1 | 2 | 3 | 4 | 5;
  const avatarBackgroundColor = semantics[`avatarPaletteBg${index}`];

  const channelImage = channel.data?.image;

  const usersForGroup = useMemo(
    () => Object.values(channel.state.members).map((member) => member.user as UserResponse),
    [channel.state.members],
  );
  const usersWithoutSelf = useMemo(
    () => usersForGroup.filter((user) => user.id !== client.user?.id),
    [usersForGroup, client.user?.id],
  );

  if (channelImage) {
    return (
      <Avatar
        backgroundColor={avatarBackgroundColor}
        imageUrl={channelImage}
        showBorder={showBorder}
        size={size}
      />
    );
  }

  if (usersWithoutSelf.length > 1) {
    return (
      <UserAvatarGroup size='xl' users={usersForGroup} showOnlineIndicator={showOnlineIndicator} />
    );
  } else {
    return (
      <UserAvatar
        user={usersWithoutSelf[0]}
        size={size}
        showBorder={showBorder}
        showOnlineIndicator={showOnlineIndicator}
      />
    );
  }
};
