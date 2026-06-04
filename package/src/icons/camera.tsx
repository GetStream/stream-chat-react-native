import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Camera = ({ height, size, width, ...props }: IconProps) => (
  <Svg
    fill='none'
    height={height ?? size}
    width={width ?? size}
    viewBox={'0 0 20 20'}
    strokeWidth={1.5}
    strokeLinejoin='round'
    {...props}
  >
    <Path
      d='M16.25 16.25H3.75C3.41848 16.25 3.10054 16.1183 2.86612 15.8839C2.6317 15.6495 2.5 15.3315 2.5 15V6.25C2.5 5.91848 2.6317 5.60054 2.86612 5.36612C3.10054 5.1317 3.41848 5 3.75 5H6.25L7.5 3.125H12.5L13.75 5H16.25C16.5815 5 16.8995 5.1317 17.1339 5.36612C17.3683 5.60054 17.5 5.91848 17.5 6.25V15C17.5 15.3315 17.3683 15.6495 17.1339 15.8839C16.8995 16.1183 16.5815 16.25 16.25 16.25Z'
      {...props}
    />
    <Path
      d='M10 13.125C11.5533 13.125 12.8125 11.8658 12.8125 10.3125C12.8125 8.7592 11.5533 7.5 10 7.5C8.4467 7.5 7.1875 8.7592 7.1875 10.3125C7.1875 11.8658 8.4467 13.125 10 13.125Z'
      {...props}
    />
  </Svg>
);
