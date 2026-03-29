import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Checkmark = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
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
        d='M2.29167 12.5782L7.5 16.875L17.7083 3.125'
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
};
