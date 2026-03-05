import React from 'react';

import Svg, { Path, Rect } from 'react-native-svg';

import { IconProps } from './utils/base';

export const OtherFileIcon = ({ height, width, ...rest }: IconProps) => (
  <Svg width={width} height={height} viewBox='0 0 40 48' fill='none'>
    <Path
      d='M0 4C0 1.79086 1.79086 0 4 0H28L40 12V44C40 46.2091 38.2091 48 36 48H4C1.79086 48 0 46.2091 0 44V4Z'
      fill='#888888'
      {...rest}
    />
    <Path
      opacity='0.5'
      d='M40 12L31 12C29.3431 12 28 10.6569 28 9V0L40 12Z'
      fill='white'
      {...rest}
    />
    <Rect x='11' y='16.6001' width='16.2' height='1.8' rx='0.9' fill='white' />
    <Rect x='11' y='25.6001' width='16.2' height='1.8' rx='0.9' fill='white' />
    <Rect x='11' y='21.1001' width='10.8' height='1.8' rx='0.9' fill='white' />
  </Svg>
);
