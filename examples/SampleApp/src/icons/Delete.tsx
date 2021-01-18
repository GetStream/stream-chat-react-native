import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from 'stream-chat-react-native';

import { IconProps } from '../utils/base';

export const Delete: React.FC<IconProps> = ({ fill, height, width }) => {
  const {
    theme: {
      colors: { black },
    },
  } = useTheme();

  return (
    <Svg
      fill='none'
      height={height}
      viewBox={`0 0 ${height} ${width}`}
      width={width}
    >
      <Path
        clipRule='evenodd'
        d='M8 3a1 1 0 011-1h6a1 1 0 011 1v1h3a1 1 0 110 2H5a1 1 0 110-2h3V3zM6 7a1 1 0 011 1v11a1 1 0 001 1h8a1 1 0 001-1V8a1 1 0 112 0v11a3 3 0 01-3 3H8a3 3 0 01-3-3V8a1 1 0 011-1z'
        fill={fill || black}
        fillRule='evenodd'
      />
      <Path
        clipRule='evenodd'
        d='M10 8a1 1 0 011 1v8a1 1 0 11-2 0V9a1 1 0 011-1zM14 8a1 1 0 011 1v8a1 1 0 11-2 0V9a1 1 0 011-1z'
        fill={fill || black}
        fillRule='evenodd'
      />
    </Svg>
  );
};
