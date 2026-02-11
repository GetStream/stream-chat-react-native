import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const RotateCircle = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 16 16'} width={width}>
    <Path
      d='M13.1731 9.83333C12.418 11.9695 10.3807 13.5 7.98599 13.5C4.94843 13.5 2.48599 11.0375 2.48599 8C2.48599 4.96243 4.94843 2.5 7.98599 2.5C9.86413 2.5 11.1194 3.30292 12.3333 4.67261M12.8333 2.66667V4.83333C12.8333 5.10947 12.6095 5.33333 12.3333 5.33333H10.1667'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
