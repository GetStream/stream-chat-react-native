import React from 'react';
import { I18nManager } from 'react-native';

import { G, Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const VideoIcon = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg
      fill={'none'}
      height={height ?? size}
      viewBox={`0 0 20 20`}
      width={width ?? size}
      {...rest}
    >
      <G transform={I18nManager.isRTL ? 'matrix(-1 0 0 1 20 0)' : undefined}>
        <Path
          d='M15.625 8.75L19.375 6.25V13.75L15.625 11.25M2.5 5H15C15.3452 5 15.625 5.27982 15.625 5.625V14.375C15.625 14.7202 15.3452 15 15 15H2.5C2.15482 15 1.875 14.7202 1.875 14.375V5.625C1.875 5.27982 2.15482 5 2.5 5Z'
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </G>
    </Svg>
  );
};
