import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const NewClose = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg height={height ?? size} viewBox={'0 0 20 20'} width={width ?? size} fill='none' {...rest}>
      <Path
        d='M13.5 6.5L6.5 13.5M13.5 13.5L6.5 6.5'
        stroke={color}
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
      />
    </Svg>
  );
};
