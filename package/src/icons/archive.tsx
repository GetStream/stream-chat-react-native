import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Archive: React.FC<IconProps> = ({ height, size, width, ...props }) => (
  <Svg viewBox={'0 0 20 20'} fill='none' height={height ?? size} width={width ?? size} {...props}>
    <Path
      d='M16.875 7.5V15C16.875 15.1658 16.8092 15.3247 16.6919 15.4419C16.5747 15.5592 16.4158 15.625 16.25 15.625H3.75C3.58424 15.625 3.42527 15.5592 3.30806 15.4419C3.19085 15.3247 3.125 15.1658 3.125 15V7.5M8.125 10.625H11.875M2.5 4.375H17.5C17.8452 4.375 18.125 4.65482 18.125 5V6.875C18.125 7.22018 17.8452 7.5 17.5 7.5H2.5C2.15482 7.5 1.875 7.22018 1.875 6.875V5C1.875 4.65482 2.15482 4.375 2.5 4.375Z'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    />
  </Svg>
);
