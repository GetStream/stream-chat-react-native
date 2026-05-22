import React from 'react';
import { I18nManager } from 'react-native';

import Svg, { G, Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const ThreadReply = ({
  fill,
  height,
  pathFill,
  size,
  stroke,
  width,
  ...rest
}: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg viewBox='0 0 20 20' fill='none' height={height ?? size} width={width ?? size} {...rest}>
      <G transform={I18nManager.isRTL ? 'matrix(-1 0 0 1 20 0)' : undefined}>
        <Path
          d='M7.5 8.75H12.8125M7.5 11.25H12.8125M10.3125 16.875H3.75C3.58424 16.875 3.42527 16.8092 3.30806 16.6919C3.19085 16.5747 3.125 16.4158 3.125 16.25V9.6875C3.125 7.78126 3.88225 5.95309 5.23017 4.60517C6.57809 3.25725 8.40626 2.5 10.3125 2.5C11.2564 2.5 12.191 2.68591 13.063 3.04712C13.9351 3.40832 14.7274 3.93775 15.3948 4.60517C16.0623 5.27259 16.5917 6.06493 16.9529 6.93696C17.3141 7.80899 17.5 8.74362 17.5 9.6875C17.5 10.6314 17.3141 11.566 16.9529 12.438C16.5917 13.3101 16.0623 14.1024 15.3948 14.7698C14.7274 15.4373 13.9351 15.9667 13.063 16.3279C12.191 16.6891 11.2564 16.875 10.3125 16.875Z'
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </G>
    </Svg>
  );
};
