import React from 'react';
import { IconProps } from '../utils/base';
import Svg, { Path } from 'react-native-svg';
export const Check: React.FC<IconProps> = ({ fill, height, width }) => (
  <Svg
    fill='none'
    height={height}
    viewBox={`0 0 ${height} ${width}`}
    width={width}
  >
    <Path
      clipRule='evenodd'
      d='M5.293 11.293a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414z'
      fill={fill || '#000'}
      fillRule='evenodd'
    />
    <Path
      clipRule='evenodd'
      d='M18.707 7.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414-1.414l8-8a1 1 0 011.414 0z'
      fill={fill || '#000'}
      fillRule='evenodd'
    />
  </Svg>
);
