import React, { useMemo } from 'react';

import { Channel, ChannelMemberResponse, UserResponse } from 'stream-chat';

import { Avatar } from './Avatar';

import { UserAvatarGroup } from './AvatarGroup';

import { UserAvatar } from './UserAvatar';

import { useA11yLabel } from '../../../a11y/hooks/useA11yLabel';
import { useChannelPreviewDisplayPresence } from '../../../components/ChannelPreview/hooks/useChannelPreviewDisplayPresence';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useChannelImage } from '../../../hooks/useChannelImage';
import { useChannelName } from '../../../hooks/useChannelName';
import { useDisplayedChannelMemberCount } from '../../../hooks/useDisplayedChannelMemberCount';
import { CompositeAccessibilityProbe } from '../../Accessibility/CompositeAccessibilityProbe';
import { useChannelMembersState } from '../../ChannelList/hooks/useChannelMembersState';

const pickAvatarFields = (member: ChannelMemberResponse) => ({
  id: member.user?.id,
  image: member.user?.image,
  name: member.user?.name,
});

export type ChannelAvatarProps = {
  channel: Channel;
  /** Renders `previewUri` in place of the channel's stored image. Defaults to false. */
  isPreview?: boolean;
  /** Image shown when `isPreview` is true. `null` shows the fallback member or user avatar. */
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

  const avatarBackgroundColor = semantics.avatarBgDefault;

  const channelImage = useChannelImage(channel);
  const imageToDisplay = isPreview ? previewUri : channelImage;

  const members = useChannelMembersState(channel, pickAvatarFields);
  const usersForGroup = useMemo(
    () => Object.values(members ?? {}).map((member) => member.user as UserResponse),
    [members],
  );
  const usersWithoutSelf = useMemo(
    () => usersForGroup.filter((user) => user.id !== client.user?.id),
    [usersForGroup, client.user?.id],
  );

  const channelName = useChannelName(channel) ?? channel.cid;

  const memberCount = Object.keys(members).length;
  const displayedMemberCount = useDisplayedChannelMemberCount(channel) || memberCount;
  const isGroup = !!channel.data?.custom?.name || memberCount > 2;
  const otherUserName = usersWithoutSelf[0]?.name || usersWithoutSelf[0]?.id;
  const labelParams = useMemo(
    () => ({ count: displayedMemberCount, name: otherUserName ?? '' }),
    [displayedMemberCount, otherUserName],
  );
  const accessibilityLabel = useA11yLabel(
    isGroup
      ? 'avatar.channel.group.accessibilityLabel'
      : 'avatar.channel.direct.accessibilityLabel',
    labelParams,
  );

  return (
    <CompositeAccessibilityProbe label={accessibilityLabel}>
      {imageToDisplay ? (
        <Avatar
          backgroundColor={avatarBackgroundColor}
          imageUrl={imageToDisplay}
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
