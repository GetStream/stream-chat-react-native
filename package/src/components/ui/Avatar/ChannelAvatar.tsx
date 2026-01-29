import React, { useMemo } from 'react';

import { Channel } from 'stream-chat';

import { Avatar } from './Avatar';

import { iconSizes } from './constants';

import { UserAvatar } from './UserAvatar';

import { useChannelPreviewDisplayPresence } from '../../../components/ChannelPreview/hooks/useChannelPreviewDisplayPresence';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { GroupIcon } from '../../../icons/GroupIcon';
import { hashStringToNumber } from '../../../utils/utils';

export type ChannelAvatarProps = {
  channel: Channel;
  showOnlineIndicator?: boolean;
  size: 'xs' | 'sm' | 'md' | 'lg';
  showBorder?: boolean;
};

export const ChannelAvatar = (props: ChannelAvatarProps) => {
  const { client } = useChatContext();
  const { channel } = props;
  const members = Object.values(channel.state.members);
  const online = useChannelPreviewDisplayPresence(channel);

  const {
    theme: { semantics },
  } = useTheme();

  const hashedValue = hashStringToNumber(channel.cid);
  const index = ((hashedValue % 5) + 1) as 1 | 2 | 3 | 4 | 5;
  const avatarBackgroundColor = semantics[`avatarPaletteBg${index}`];
  const avatarTextColor = semantics[`avatarPaletteText${index}`];

  const { size, showBorder = true, showOnlineIndicator = online } = props;

  const channelImage = channel.data?.image;

  const placeholder = useMemo(() => {
    return <GroupIcon height={iconSizes[size]} stroke={avatarTextColor} width={iconSizes[size]} />;
  }, [size, avatarTextColor]);

  if (!channelImage) {
    const otherMembers = members.filter((member) => member.user?.id !== client?.user?.id);
    const otherUser = otherMembers?.[0]?.user;

    const user = members.length === 1 ? client.user : members.length === 2 ? otherUser : null;
    if (user) {
      return (
        <UserAvatar
          user={user}
          size={size}
          showBorder={showBorder}
          showOnlineIndicator={showOnlineIndicator}
        />
      );
    }
  }

  return (
    <Avatar
      backgroundColor={avatarBackgroundColor}
      imageUrl={channelImage}
      placeholder={placeholder}
      showBorder={showBorder}
      size={size}
    />
  );
};
