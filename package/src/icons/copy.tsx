import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Copy = ({ height, size, width, ...props }: IconProps) => (
  <Svg viewBox={'0 0 20 20'} fill='none' height={height ?? size} width={width ?? size} {...props}>
    <Path
      d='M13.125 13.125H16.875V3.125H6.875V6.875M3.125 6.875H13.125V16.875H3.125V6.875Z'
      {...props}
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </Svg>
);
