import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const CircleMinus = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 20 20'} width={width} {...rest}>
    <Path
      d='M13.5355 10.0005H6.46449M17.7084 10.0001C17.7084 14.2572 14.2572 17.7084 10 17.7084C5.74283 17.7084 2.29169 14.2572 2.29169 10.0001C2.29169 5.74289 5.74283 2.29175 10 2.29175C14.2572 2.29175 17.7084 5.74289 17.7084 10.0001Z'
      strokeWidth={1.5}
      strokeLinecap='round'
      {...rest}
    />
  </Svg>
);
