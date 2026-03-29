import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const RotateCircle = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 16 16'} width={width}>
    <Path
      d='M10.5 6H13.5M13.5 6V3M13.5 6L11.7325 4.2325C10.7086 3.20876 9.32295 2.62967 7.8755 2.62125C6.42805 2.61282 5.03575 3.17574 4 4.1875M5.5 10H2.5M2.5 10V13M2.5 10L4.2675 11.7675C5.29135 12.7912 6.67705 13.3703 8.1245 13.3788C9.57195 13.3872 10.9643 12.8243 12 11.8125'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
