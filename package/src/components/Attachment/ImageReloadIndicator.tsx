import React from 'react';
import { Pressable } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Refresh } from '../../icons';

const REFRESH_ICON_SIZE = 24;

export type ImageReloadIndicatorProps = {
  onReloadImage: () => void;
  style: React.ComponentProps<typeof Pressable>['style'];
};

export const ImageReloadIndicator = ({ onReloadImage, style }: ImageReloadIndicatorProps) => {
  const {
    theme: {
      colors: { grey_dark },
    },
  } = useTheme();

  return (
    <Pressable onPress={onReloadImage} style={style}>
      <Refresh height={REFRESH_ICON_SIZE} pathFill={grey_dark} width={REFRESH_ICON_SIZE} />
    </Pressable>
  );
};
