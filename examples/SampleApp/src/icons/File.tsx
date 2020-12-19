import React from 'react';
import { IconProps, RootPath, RootSvg } from '../utils/base';
import Svg, { G, Path } from 'react-native-svg';

export const File: React.FC<IconProps> = ({
  fill = '#000',
  height = 24,
  scale = 1,
  width = 24,
}) => (
  <Svg
    fill='none'
    height={height * scale}
    viewBox={`0 0 ${height * scale} ${width * scale}`}
    width={width * scale}
  >
    <G scale={scale}>
      <Path
        clipRule='evenodd'
        d='M21 5h-8.586l-2-2H3a1 1 0 00-1 1v16a1 1 0 001 1h18a1 1 0 001-1V6a1 1 0 00-1-1zM4 19V7h16v12H4z'
        fill={fill}
        fillRule='evenodd'
        opacity={0.5}
      />
    </G>
  </Svg>
);
