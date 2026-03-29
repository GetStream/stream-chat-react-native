import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const PollThumbnail = ({
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
      <Path
        d='M3.75 16.25V10.625H7.5M17.5 16.25H2.5M7.5 16.25V6.875H11.875M11.875 16.25V3.125H16.25V16.25'
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
};
