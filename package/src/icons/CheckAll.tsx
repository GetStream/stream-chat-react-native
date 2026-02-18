import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const CheckAll = ({ height, width, ...rest }: IconProps) => (
  <Svg viewBox='0 0 16 16' fill='none' height={height} width={width}>
    <Path
      d='M1.75 9.0625L4.9375 12.25L10.25 3.75M8.9375 12.25L14.25 3.75'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...rest}
    />
  </Svg>
);
