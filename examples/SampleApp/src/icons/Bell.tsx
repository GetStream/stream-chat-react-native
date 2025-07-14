import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from 'stream-chat-react-native';

import { IconProps } from '../utils/base';

export const Bell: React.FC<IconProps> = ({ height = 512, width = 512 }) => {
  const {
    theme: {
      colors: { grey },
    },
  } = useTheme();

  return (
    <Svg height={height} viewBox={'0 0 24 24'} width={width}>
      <Path
        d='M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.9,2 2,2zM18,16v-5c0,-3.07 -1.63,-5.64 -4.5,-6.32L13.5,4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.64,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2zM16,17L8,17v-6c0,-2.48 1.51,-4.5 4,-4.5s4,2.02 4,4.5v6z'
        fill={grey}
      />
    </Svg>
  );
};
