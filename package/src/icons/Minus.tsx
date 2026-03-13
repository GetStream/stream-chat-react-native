import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Minus = ({ height, width, ...rest }: IconProps) => (
  <Svg width={width} height={height} viewBox='0 0 20 20' fill='none' {...rest}>
    <Path d='M5.625 10H10H14.375' strokeWidth={1.5} strokeLinecap='round' {...rest} />
  </Svg>
);
