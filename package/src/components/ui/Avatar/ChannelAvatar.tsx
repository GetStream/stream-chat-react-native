import React, { useMemo } from 'react';

import { Channel, UserResponse } from 'stream-chat';

import { Avatar } from './Avatar';

import { UserAvatarGroup } from './AvatarGroup';

import { UserAvatar } from './UserAvatar';

import { useA11yLabel } from '../../../a11y/hooks/useA11yLabel';
import { useChannelPreviewDisplayPresence } from '../../../components/ChannelPreview/hooks/useChannelPreviewDisplayPresence';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { hashStringToNumber } from '../../../utils/utils';
import { CompositeAccessibilityProbe } from '../../Accessibility/CompositeAccessibilityProbe';

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

  const channelName = (channel.data?.name as string | undefined) ?? channel.cid;

  const memberCount = Object.keys(channel.state.members).length;
  const isGroup = !!channel.data?.name || memberCount > 2;
  const otherUserName = usersWithoutSelf[0]?.name || usersWithoutSelf[0]?.id;
  const labelParams = useMemo(
    () => ({ count: memberCount, name: otherUserName ?? '' }),
    [memberCount, otherUserName],
  );
  const accessibilityLabel = useA11yLabel(
    isGroup ? 'a11y/Channel with {{count}} members' : 'a11y/Direct chat with {{name}}',
    labelParams,
  );

  return (
    <CompositeAccessibilityProbe label={accessibilityLabel}>
      {channelImage ? (
        <Avatar
          backgroundColor={avatarBackgroundColor}
          imageUrl={channelImage}
          name={channelName}
          showBorder={showBorder}
          size={size}
        />
      ) : usersWithoutSelf.length > 1 ? (
        <UserAvatarGroup
          size={size}
          users={usersForGroup}
          showOnlineIndicator={showOnlineIndicator}
        />
      ) : (
        <UserAvatar
          user={usersWithoutSelf[0]}
          size={size}
          showBorder={showBorder}
          showOnlineIndicator={showOnlineIndicator}
        />
      )}
    </CompositeAccessibilityProbe>
  );
};
