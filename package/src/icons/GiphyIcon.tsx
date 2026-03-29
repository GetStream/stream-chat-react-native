import React from 'react';

import Svg, { Path, Rect } from 'react-native-svg';

import { IconProps } from './utils/base';

export const GiphyIcon = ({ height, size, width, ...props }: IconProps) => (
  <Svg viewBox='0 0 20 20' fill='none' height={height ?? size} width={width ?? size} {...props}>
    <Rect width={20} height={20} rx={10} fill='black' />
    <Path
      fillRule='evenodd'
      clipRule='evenodd'
      d='M6.5997 5.50024H13.4008V14.4999H6.59912L6.5997 5.50024Z'
      fill='black'
    />
    <Path d='M5.24023 5.1665H6.59998V14.8335H5.24023V5.1665Z' fill='#04FF8E' />
    <Path d='M13.4004 7.8335H14.7601V14.8335H13.4004V7.8335Z' fill='#8E2EFF' />
    <Path d='M5.24023 14.4998H14.7602V15.8333H5.24023V14.4998Z' fill='#00C5FF' />
    <Path d='M5.24023 4.16675H10.6804V5.50025H5.24023V4.16675Z' fill='#FFF152' />
    <Path
      d='M13.4003 6.83316V5.50025H12.0399V4.16675H10.6802V8.16666H14.76V6.83316'
      fill='#FF5B5B'
    />
    <Path d='M13.4004 9.5V8.1665H14.7601' fill='#551C99' />
    <Path
      fillRule='evenodd'
      clipRule='evenodd'
      d='M10.6802 4.16675V5.50025H9.31982'
      fill='#999131'
    />
  </Svg>
);
