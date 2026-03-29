import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Check = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg viewBox={'0 0 16 16'} fill='none' height={height ?? size} width={width ?? size} {...rest}>
      <Path
        d='M3.75 9.0625L6.9375 12.25L12.25 3.75'
        fill='none'
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
};
