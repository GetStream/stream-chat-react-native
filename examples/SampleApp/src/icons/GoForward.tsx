import React from 'react';
import { IconProps } from '../utils/base';
import Svg, { G, Path } from 'react-native-svg';

export const GoForward: React.FC<IconProps> = ({ active, height, width }) => (
  <Svg
    fill='none'
    height={height}
    viewBox={`0 0 ${height} ${width}`}
    width={width}
  >
    <Path
      clipRule='evenodd'
      d='M8.306 18.694a1.043 1.043 0 010-1.476L13.53 12 8.306 6.782a1.043 1.043 0 010-1.476 1.046 1.046 0 011.478 0l5.91 5.904c.217.217.319.506.305.79a1.04 1.04 0 01-.305.79l-5.91 5.904a1.046 1.046 0 01-1.478 0z'
      fill='#000'
      fillRule='evenodd'
      opacity={0.5}
    />
  </Svg>
);
