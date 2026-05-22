import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Minus = ({ height, size, width, ...rest }: IconProps) => (
  <Svg width={width ?? size} height={height ?? size} viewBox={'0 0 20 20'} fill='none' {...rest}>
    <Path d='M3.125 10H16.875' strokeWidth={1.5} strokeLinecap='round' {...rest} />
  </Svg>
);
