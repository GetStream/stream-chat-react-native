import React from 'react';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Reaction } from '../../types/types';
import { Avatar, AvatarProps } from '../Avatar/Avatar';

export type MessageUserReactionsAvatarProps = {
  /**
   * The reaction object
   */
  reaction: Reaction;
} & Partial<Pick<AvatarProps, 'size'>>;

export const MessageUserReactionsAvatar = (props: MessageUserReactionsAvatarProps) => {
  const {
    reaction: { image, name },
    size,
  } = props;

  const {
    theme: {
      avatar: { BASE_AVATAR_SIZE },
    },
  } = useTheme();

  return <Avatar image={image} name={name} size={size || BASE_AVATAR_SIZE} />;
};
