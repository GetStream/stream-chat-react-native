import React from 'react';

import { ChannelPreviewProps } from './ChannelPreview';

import { useChannelPreviewDisplayPresence } from './hooks/useChannelPreviewDisplayPresence';

import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { ChannelAvatar, UserAvatar } from '../ui';

export type ChannelPreviewAvatarProps = Pick<ChannelPreviewProps, 'channel'>;

export const ChannelPreviewAvatar = ({ channel }: ChannelPreviewAvatarProps) => {
  const { client } = useChatContext();
  const members = channel.state.members;
  const membersValues = Object.values(members);
  const otherMembers = membersValues.filter((member) => member.user?.id !== client?.user?.id);

  const online = useChannelPreviewDisplayPresence(channel);

  return otherMembers.length === 1 ? (
    <UserAvatar
      size='lg'
      user={otherMembers[0].user}
      showBorder={otherMembers[0].user?.image ? true : false}
      showOnlineIndicator={online}
    />
  ) : (
    <ChannelAvatar channel={channel} size='lg' />
  );
};
