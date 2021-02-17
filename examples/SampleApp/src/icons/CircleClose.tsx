import React from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { useTheme } from 'stream-chat-react-native';

import { IconProps } from '../utils/base';

export const CircleClose: React.FC<IconProps> = ({
  height = 24,
  width = 24,
}) => {
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
      <G clipRule='evenodd' fill={black} fillRule='evenodd' opacity={0.5}>
        <Path d='M14.121 8.464a1 1 0 111.415 1.415L13.414 12l2.122 2.121a1 1 0 01-1.415 1.415l-2.12-2.122-2.122 2.122a1 1 0 11-1.414-1.415L10.585 12l-2.12-2.121a1 1 0 111.414-1.415L12 10.586l2.121-2.122z' />
        <Path d='M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM4 12a8 8 0 1116 0 8 8 0 01-16 0z' />
      </G>
    </Svg>
  );
};
