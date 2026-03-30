import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const ArrowUp = ({ height, size, width, ...rest }: IconProps) => (
  <Svg height={height ?? size} viewBox={'0 0 20 20'} fill='none' width={width ?? size}>
    <Path
      d='M10 16.875V3.125M10 3.125L4.375 8.75M10 3.125L15.625 8.75'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...rest}
    />
  </Svg>
);

export const Down = ({ height, size, width, ...rest }: IconProps) => (
  <Svg
    fill={'none'}
    height={height ?? size}
    viewBox={'0 0 20 20'}
    width={width ?? size}
    {...rest}
  >
    <Path
      d='M10 16.875V3.125M10 3.125L4.375 8.75M10 3.125L15.625 8.75'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      transform='rotate(180 10 10)'
      {...rest}
    />
  </Svg>
);
