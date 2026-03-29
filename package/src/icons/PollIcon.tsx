import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const PollIcon = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 20 20'} width={width} {...rest}>
    <Path
      d='M3.75 16.25V10.625H7.5M17.5 16.25H2.5M7.5 16.25V6.875H11.875M11.875 16.25V3.125H16.25V16.25'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
