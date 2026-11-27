import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Calendar = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg viewBox={'0 0 20 20'} fill='none' height={height ?? size} width={width ?? size} {...rest}>
      <Path
        d='M3.125 7.5H16.875M6.25 2.5V5M13.75 2.5V5M3.75 3.75H16.25C16.5952 3.75 16.875 4.02982 16.875 4.375V16.875C16.875 17.2202 16.5952 17.5 16.25 17.5H3.75C3.40482 17.5 3.125 17.2202 3.125 16.875V4.375C3.125 4.02982 3.40482 3.75 3.75 3.75Z'
        fill='none'
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
};
