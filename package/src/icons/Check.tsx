import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Check = ({ height, width, ...rest }: IconProps) => (
  <Svg viewBox='0 0 16 16' fill='none' height={height} width={width}>
    <Path
      d='M3.75 9.0625L6.9375 12.25L12.25 3.75'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...rest}
    />
  </Svg>
);
