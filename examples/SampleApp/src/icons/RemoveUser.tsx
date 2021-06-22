import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from 'stream-chat-react-native';

import { IconProps } from '../utils/base';

export const RemoveUser: React.FC<IconProps> = ({ height, width }) => {
  const {
    theme: {
      colors: { grey },
    },
  } = useTheme();

  return (
    <Svg fill='none' height={height} viewBox={`0 0 ${height} ${width}`} width={width}>
      <Path
        clipRule='evenodd'
        d='M16.911 7a3.997 3.997 0 01-1.61 3.211c1.01.187 1.927.492 2.747.888.497.24.705.837.466 1.335a.996.996 0 01-1.331.467c-1.134-.548-2.55-.901-4.26-.901-5.517 0-7.978 3.632-7.978 6a.999.999 0 11-1.994 0c0-3.158 2.66-6.871 7.594-7.788A3.998 3.998 0 018.933 7c0-2.21 1.786-4 3.99-4a3.994 3.994 0 013.988 4zm-3.989 2a1.997 1.997 0 001.995-2c0-1.105-.893-2-1.995-2a1.997 1.997 0 00-1.994 2c0 1.105.893 2 1.994 2zm9.973 9v-2H16.91v2h5.984z'
        fill={grey}
        fillRule='evenodd'
      />
    </Svg>
  );
};
