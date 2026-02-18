import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Time = ({ height, width, ...rest }: IconProps) => (
  <Svg viewBox='0 0 16 16' fill='none' height={height} width={width}>
    <Path
      d='M8.00001 5.16659V7.99992L9.83334 9.83325M14.1667 7.99992C14.1667 11.4057 11.4057 14.1666 8.00001 14.1666C4.59426 14.1666 1.83334 11.4057 1.83334 7.99992C1.83334 4.59417 4.59426 1.83325 8.00001 1.83325C11.4057 1.83325 14.1667 4.59417 14.1667 7.99992Z'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...rest}
    />
  </Svg>
);
