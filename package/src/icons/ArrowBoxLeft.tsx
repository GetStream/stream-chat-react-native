import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const ArrowBoxLeft: React.FC<IconProps> = (props) => (
  <Svg viewBox='0 0 20 20' fill='none' {...props}>
    <Path
      d='M16.875 10H7.5M16.875 10L13.125 13.75M16.875 10L13.125 6.25M9.375 16.875H4.79167C3.87119 16.875 3.125 16.1288 3.125 15.2083V4.79167C3.125 3.87119 3.87119 3.125 4.79167 3.125H9.375'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    />
  </Svg>
);
