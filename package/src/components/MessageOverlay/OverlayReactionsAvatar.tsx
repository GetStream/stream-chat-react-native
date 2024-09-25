import React from 'react';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Reaction } from '../../types/types';
import { Avatar, AvatarProps } from '../Avatar/Avatar';

export type OverlayReactionsAvatarProps = {
  reaction: Reaction;
} & Partial<Pick<AvatarProps, 'size'>>;

export const OverlayReactionsAvatar = (props: OverlayReactionsAvatarProps) => {
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
