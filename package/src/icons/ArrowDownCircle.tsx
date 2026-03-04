import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const ArrowDownCircle = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 20 20'} width={width} {...rest}>
    <Path
      d='M12.7084 10.8346L10 13.543L7.29169 10.8346M10 6.45964V12.918M2.29169 10.0013C2.29169 14.2585 5.74283 17.7096 10 17.7096C14.2572 17.7096 17.7084 14.2585 17.7084 10.0013C17.7084 5.74411 14.2572 2.29297 10 2.29297C5.74283 2.29297 2.29169 5.74411 2.29169 10.0013Z'
      strokeLinejoin='round'
      strokeLinecap='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
