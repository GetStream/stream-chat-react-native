import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const CommandsIcon = ({ height, size, width, ...props }: IconProps) => (
  <Svg
    fill='none'
    height={height ?? size}
    width={width ?? size}
    viewBox={'2.25 3.25 15.5 13.75'}
    {...props}
  >
    <Path
      d='M6.25 7.5L9.375 10L6.25 12.5M10.625 12.5H13.75M3.125 3.75H16.875C17.2202 3.75 17.5 4.02982 17.5 4.375V15.625C17.5 15.9702 17.2202 16.25 16.875 16.25H3.125C2.77982 16.25 2.5 15.9702 2.5 15.625V4.375C2.5 4.02982 2.77982 3.75 3.125 3.75Z'
      strokeWidth={1.5}
      strokeLinejoin='round'
      {...props}
    />
  </Svg>
);
