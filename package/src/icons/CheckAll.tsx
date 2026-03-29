import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const CheckAll = ({ height, size, width, ...rest }: IconProps) => (
  <Svg viewBox={'0 0 20 20'} fill='none' height={height ?? size} width={width ?? size}>
    <Path
      d='M1.5 10.5724L4.98387 13.9936L13.1129 6.00977M10.371 13.9936L18.5 6.00977'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...rest}
    />
  </Svg>
);
