import React from 'react';

import type { Reaction } from './OverlayReactions';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Avatar, AvatarProps } from '../Avatar/Avatar';

export type OverlayReactionsAvatarProps = {
  reaction: Reaction;
} & Partial<Pick<AvatarProps, 'size'>>;

export const OverlayReactionsAvatar: React.FC<OverlayReactionsAvatarProps> = (props) => {
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

OverlayReactionsAvatar.displayName = 'OverlayReactionsAvatar{overlay{reactionsAvatar}}';
