import React from 'react';

import type { ChannelPreviewProps } from './ChannelPreview';
import { useChannelPreviewDisplayAvatar } from './hooks/useChannelPreviewDisplayAvatar';
import { useChannelPreviewDisplayPresence } from './hooks/useChannelPreviewDisplayPresence';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';
import { Avatar } from '../Avatar/Avatar';
import { GroupAvatar } from '../Avatar/GroupAvatar';

export type ChannelAvatarProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = Pick<ChannelPreviewProps<At, Ch, Co, Ev, Me, Re, Us>, 'channel'>;

/**
 * This UI component displays an avatar for a particular channel.
 */
export const ChannelAvatar = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  props: ChannelAvatarProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { channel } = props;

  const displayAvatar = useChannelPreviewDisplayAvatar(channel);
  const displayPresence = useChannelPreviewDisplayPresence(channel);

  if (displayAvatar.images) {
    return <GroupAvatar images={displayAvatar.images} names={displayAvatar.names} size={40} />;
  }

  return (
    <Avatar
      image={displayAvatar.image}
      name={displayAvatar.name}
      online={displayPresence}
      size={40}
    />
  );
};
