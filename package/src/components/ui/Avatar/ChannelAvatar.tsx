import React, { useMemo } from 'react';

import { Channel } from 'stream-chat';

import { Avatar } from './Avatar';

import { iconSizes } from './constants';

import { UserAvatar } from './UserAvatar';

import { useChannelPreviewDisplayPresence } from '../../../components/ChannelPreview/hooks/useChannelPreviewDisplayPresence';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { GroupIcon } from '../../../icons/GroupIcon';

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

  const { size, showBorder = true, showOnlineIndicator = online } = props;

  const channelImage = channel.data?.image;

  const placeholder = useMemo(() => {
    return <GroupIcon height={iconSizes[size]} stroke={'#003179'} width={iconSizes[size]} />;
  }, [size]);

  if (!channelImage) {
    if (members.length === 1) {
      return (
        <UserAvatar
          user={client.user}
          size={size}
          showBorder={showBorder}
          showOnlineIndicator={showOnlineIndicator}
        />
      );
    } else if (members.length === 2) {
      const otherMembers = members.filter((member) => member.user?.id !== client?.user?.id);
      const otherUser = otherMembers[0].user;
      return (
        <UserAvatar
          size={size}
          user={otherUser}
          showBorder={showBorder}
          showOnlineIndicator={showOnlineIndicator}
        />
      );
    }
  }

  return (
    <Avatar imageUrl={channelImage} placeholder={placeholder} showBorder={showBorder} size={size} />
  );
};
