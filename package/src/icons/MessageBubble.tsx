import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const MessageBubble = ({ height, width, ...props }: IconProps) => (
  <Svg height={height} width={width} fill={'none'} viewBox='0 0 20 20' {...props}>
    <Path
      d='M3.95994 3.125H16.0433C16.9637 3.125 17.71 3.87119 17.71 4.79167V13.5417C17.71 14.4622 16.9637 15.2083 16.0433 15.2083H10.0016L5.83494 17.5V15.2083H3.95994C3.03947 15.2083 2.29327 14.4622 2.29327 13.5417V4.79167C2.29327 3.87119 3.03947 3.125 3.95994 3.125Z'
      strokeLinejoin='round'
      strokeLinecap='round'
      strokeWidth={1.5}
      {...props}
    />
  </Svg>
);
