import React from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { useTheme } from 'stream-chat-react-native';

import { IconProps } from '../utils/base';

export const Notification: React.FC<IconProps> = ({ fill, height = 24, scale = 1, width = 24 }) => {
  const {
    theme: {
      colors: { black },
    },
  } = useTheme();

  return (
    <Svg
      fill='none'
      height={height * scale}
      viewBox={`0 0 ${height * scale} ${width * scale}`}
      width={width}
    >
      <G clipRule='evenodd' fill={fill || black} fillRule='evenodd' scale={scale}>
        <Path d='M14 5a2 2 0 11-4 0 2 2 0 014 0z' />
        <Path d='M16 16v-5a4 4 0 00-8 0v5h8zM12 5a6 6 0 00-6 6v7h12v-7a6 6 0 00-6-6z' />
        <Path d='M4 17a1 1 0 011-1h14a1 1 0 110 2H5a1 1 0 01-1-1zM10 19a2 2 0 104 0h-4z' />
      </G>
    </Svg>
  );
};
