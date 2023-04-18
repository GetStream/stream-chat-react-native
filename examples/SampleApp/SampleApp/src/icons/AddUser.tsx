import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from 'stream-chat-react-native';

import { IconProps } from '../utils/base';

export const AddUser: React.FC<IconProps> = ({ fill, height, width }) => {
  const {
    theme: {
      colors: { grey },
    },
  } = useTheme();

  return (
    <Svg fill='none' height={height} viewBox={`0 0 ${height} ${width}`} width={width}>
      <Path
        clipRule='evenodd'
        d='M12 11a4 4 0 100-8 4 4 0 000 8zm0-2a2 2 0 100-4 2 2 0 000 4z'
        fill={fill || grey}
        fillRule='evenodd'
      />
      <Path
        clipRule='evenodd'
        d='M12 12c-5.531 0-8 3.632-8 6a1 1 0 11-2 0c0-3.632 3.531-8 10-8 1.995 0 3.714.412 5.14 1.1a1 1 0 11-.868 1.8c-1.137-.547-2.556-.9-4.272-.9zM20 14h-2v2h-2v2h2v2h2v-2h2v-2h-2v-2z'
        fill={fill || grey}
        fillRule='evenodd'
      />
    </Svg>
  );
};
