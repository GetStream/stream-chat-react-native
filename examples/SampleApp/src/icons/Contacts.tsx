import React from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { useTheme } from 'stream-chat-react-native';

import { IconProps } from '../utils/base';

export const Contacts: React.FC<IconProps> = ({ fill, height = 24, scale = 1, width = 24 }) => {
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
      width={width * scale}
    >
      <G scale={scale}>
        <Path
          clipRule='evenodd'
          d='M16 7a4 4 0 11-8 0 4 4 0 018 0zm-2 0a2 2 0 11-4 0 2 2 0 014 0z'
          fill={fill || black}
          fillRule='evenodd'
        />
        <Path
          d='M6.5 5a2.5 2.5 0 000 5m11.417 10.001a6 6 0 10-11.833.003m-1.86-7.008a5.988 5.988 0 00-2.14 5.667M18 5a2.5 2.5 0 010 5m2 2.996a5.988 5.988 0 012.14 5.667'
          stroke={fill || black}
          strokeLinecap='round'
          strokeWidth={2}
        />
      </G>
    </Svg>
  );
};
