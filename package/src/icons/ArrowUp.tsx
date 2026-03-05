import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const ArrowUp = ({ height, width, ...rest }: IconProps) => (
  <Svg height={height} viewBox='0 0 20 20' fill='none' width={width}>
    <Path
      d='M4.79175 8.33333L10.0001 3.125L15.2084 8.33333M10.0001 16.875V3.75'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...rest}
    />
  </Svg>
);
