import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Bookmark = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg
      fill={'none'}
      height={height ?? size}
      viewBox={'0 0 20 20'}
      width={width ?? size}
      {...rest}
    >
      <Path
        d='M15 17.5L10 14.375L5 17.5V3.75C5 3.58424 5.06585 3.42527 5.18306 3.30806C5.30027 3.19085 5.45924 3.125 5.625 3.125H14.375C14.5408 3.125 14.6997 3.19085 14.8169 3.30806C14.9342 3.42527 15 3.58424 15 3.75V17.5Z'
        stroke={color}
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
      />
    </Svg>
  );
};
