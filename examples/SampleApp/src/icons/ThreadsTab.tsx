import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from 'stream-chat-react-native';

import { IconProps } from '../utils/base';

export const ThreadsTab: React.FC<IconProps> = ({ active, height = 24, width = 24 }) => {
  const {
    theme: {
      colors: { black, grey },
    },
  } = useTheme();
  return (
    <Svg fill='none' height={height} viewBox={`0 0 ${height} ${width}`} width={width}>
      <Path
        clipRule='evenodd'
        d='M4 4H20V16H5.17L4 17.17V4ZM4 2C2.9 2 2.01 2.9 2.01 4L2 22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2H4ZM6 12H14V14H6V12ZM6 9H18V11H6V9ZM6 6H18V8H6V6Z'
        fill={active ? black : grey}
        fillRule='evenodd'
      />
    </Svg>
  );
};
