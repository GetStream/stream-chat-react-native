import React from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { useTheme } from 'stream-chat-react-native';

import { IconProps } from '../utils/base';

export const NewDirectMessageIcon: React.FC<IconProps> = ({ active, color, height, width }) => {
  const {
    theme: {
      colors: { black },
    },
  } = useTheme();
  return (
    <Svg fill='none' height={height} viewBox={`0 0 ${height} ${width}`} width={width}>
      <G opacity={active ? 1 : 0.5}>
        <Path
          clipRule='evenodd'
          d='M21 21H3v-4.243L16.435 3.322a1 1 0 011.414 0l2.829 2.829a1 1 0 010 1.414L9.243 19H21v2zM5 19h1.414l9.314-9.314-1.414-1.414L5 17.586V19zM18.556 6.858l-1.414 1.414-1.414-1.414 1.414-1.414 1.414 1.414z'
          fill={color || black}
          fillRule='evenodd'
        />
      </G>
    </Svg>
  );
};
