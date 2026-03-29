import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Tick = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={`0 0 20 20`} width={width} {...rest}>
    <Path
      d='M3.125 11.25L7.5 15.625L17.5 5.625'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
