import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const ArrowBoxLeft: React.FC<IconProps> = (props) => (
  <Svg viewBox='0 0 20 20' fill='none' {...props}>
    <Path
      d='M8.75 3.125H3.75V16.875H8.75M8.75 10H17.5M17.5 10L14.375 6.875M17.5 10L14.375 13.125'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    />
  </Svg>
);
