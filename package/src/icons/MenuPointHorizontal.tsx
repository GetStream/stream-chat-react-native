import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const MenuPointHorizontal = ({
  fill,
  height,
  pathFill,
  size,
  stroke,
  width,
  ...rest
}: IconProps) => {
  const color = fill ?? stroke ?? pathFill ?? 'black';

  return (
    <Svg
      viewBox='3 8 14 4'
      fill='none'
      height={height ?? size ?? 20}
      width={width ?? size ?? 20}
      {...rest}
    >
      <Path
        d='M10 11.25C10.6904 11.25 11.25 10.6904 11.25 10C11.25 9.30964 10.6904 8.75 10 8.75C9.30964 8.75 8.75 9.30964 8.75 10C8.75 10.6904 9.30964 11.25 10 11.25Z'
        fill={color}
      />
      <Path
        d='M4.6875 11.25C5.37786 11.25 5.9375 10.6904 5.9375 10C5.9375 9.30964 5.37786 8.75 4.6875 8.75C3.99714 8.75 3.4375 9.30964 3.4375 10C3.4375 10.6904 3.99714 11.25 4.6875 11.25Z'
        fill={color}
      />
      <Path
        d='M15.3125 11.25C16.0029 11.25 16.5625 10.6904 16.5625 10C16.5625 9.30964 16.0029 8.75 15.3125 8.75C14.6221 8.75 14.0625 9.30964 14.0625 10C14.0625 10.6904 14.6221 11.25 15.3125 11.25Z'
        fill={color}
      />
    </Svg>
  );
};
