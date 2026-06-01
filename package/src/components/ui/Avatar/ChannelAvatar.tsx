import React, { useMemo } from 'react';

import { Channel, UserResponse } from 'stream-chat';

import { Avatar } from './Avatar';

import { UserAvatarGroup } from './AvatarGroup';

import { UserAvatar } from './UserAvatar';

import { useChannelPreviewDisplayPresence } from '../../../components/ChannelPreview/hooks/useChannelPreviewDisplayPresence';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useChannelImage } from '../../../hooks/useChannelImage';
import { useChannelName } from '../../../hooks/useChannelName';
import { hashStringToNumber } from '../../../utils/utils';
import { useChannelMembersState } from '../../ChannelList/hooks/useChannelMembersState';

export type ChannelAvatarProps = {
  channel: Channel;
  /**
   * When true, the avatar renders based on `previewUri` instead of the
   * channel's stored image. Useful for previewing a pending image change before
   * it is saved. Defaults to false.
   */
  isPreview?: boolean;
  /**
   * Image to display while in preview mode (`isPreview` is true). A `string`
   * shows that image; `null` shows the no-image fallback (member/user avatar).
   */
  previewUri?: string | null;
  showOnlineIndicator?: boolean;
  size?: 'lg' | 'xl' | '2xl';
  showBorder?: boolean;
};

export const ChannelAvatar = (props: ChannelAvatarProps) => {
  const { client } = useChatContext();
  const { channel } = props;
  const online = useChannelPreviewDisplayPresence(channel);
  const {
    isPreview = false,
    previewUri = null,
    showOnlineIndicator = online,
    size = 'xl',
    showBorder = true,
  } = props;

  const {
    theme: { semantics },
  } = useTheme();

  const hashedValue = hashStringToNumber(channel.cid);
  const index = ((hashedValue % 5) + 1) as 1 | 2 | 3 | 4 | 5;
  const avatarBackgroundColor = semantics[`avatarPaletteBg${index}`];

  const channelImage = useChannelImage(channel);
  const imageToDisplay = isPreview ? previewUri : channelImage;

  const members = useChannelMembersState(channel);
  const usersForGroup = useMemo(
    () => Object.values(members).map((member) => member.user as UserResponse),
    [members],
  );
  const usersWithoutSelf = useMemo(
    () => usersForGroup.filter((user) => user.id !== client.user?.id),
    [usersForGroup, client.user?.id],
  );

  const channelName = useChannelName(channel) ?? channel.cid;

  if (imageToDisplay) {
    return (
      <Avatar
        backgroundColor={avatarBackgroundColor}
        imageUrl={imageToDisplay}
        name={channelName}
        showBorder={showBorder}
        size={size}
      />
    );
  }

  if (usersWithoutSelf.length > 1) {
    return (
      <UserAvatarGroup
        size={size}
        users={usersForGroup}
        showOnlineIndicator={showOnlineIndicator}
      />
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
