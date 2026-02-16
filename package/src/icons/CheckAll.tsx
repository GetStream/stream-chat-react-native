import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const CheckAll = ({ height, width, ...rest }: IconProps) => (
  <Svg viewBox='0 0 20 20' fill='none' height={height} width={width} {...rest}>
    <Path
      d='M4.79167 10.8856L7.44792 13.5418L11.875 6.4585M10.7813 13.5418L15.2083 6.4585'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...rest}
    />
  </Svg>
);
