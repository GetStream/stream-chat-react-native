import React from 'react';
import { IconProps } from '../utils/base';
import Svg, { G, Path } from 'react-native-svg';
export const Pictures: React.FC<IconProps> = ({ active, height, width }) => (
  <Svg
    fill='none'
    height={height}
    viewBox={`0 0 ${height} ${width}`}
    width={width}
  >
    <Path
      clipRule='evenodd'
      d='M8 14a3 3 0 013-3h14a3 3 0 013 3v8a3 3 0 01-3 3H11a3 3 0 01-3-3v-8zm3-1a1 1 0 00-1 1v8a1 1 0 001 1h14a1 1 0 001-1v-8a1 1 0 00-1-1H11z'
      fill='#006CFF'
      fillRule='evenodd'
    />
    <Path
      clipRule='evenodd'
      d='M21.99 15a1 1 0 01.778.36l5 6a1 1 0 11-1.536 1.28l-4.216-5.059-3.235 4.044a1 1 0 01-1.381.175l-3.306-2.48-3.387 3.387a1 1 0 01-1.414-1.414l4-4A1 1 0 0114.6 17.2l3.225 2.419 3.394-4.244A1 1 0 0121.99 15z'
      fill='#006CFF'
      fillRule='evenodd'
    />
  </Svg>
);
