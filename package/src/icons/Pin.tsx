import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Pin = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 16 16'} width={width} {...rest}>
    <Path
      d='M5.58333 10.417L8.13947 12.9731C8.91173 13.7453 10.234 13.3125 10.4001 12.2331L10.8931 9.02866C10.96 8.59372 11.2372 8.21979 11.6339 8.02933L13.4703 7.14793C14.2989 6.75019 14.486 5.65301 13.8361 5.00308L10.9973 2.16421C10.3473 1.51428 9.25013 1.70142 8.8524 2.53005L7.97093 4.36638C7.78053 4.76311 7.4066 5.04032 6.97167 5.10723L3.76728 5.60022C2.68784 5.76629 2.25495 7.08859 3.02721 7.86086L5.58333 10.417ZM5.58333 10.417L5.58823 10.4121M5.58333 10.417L2.5 13.5003'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
