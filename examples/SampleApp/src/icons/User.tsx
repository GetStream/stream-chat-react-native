import React from 'react';
import Svg, {Path} from 'react-native-svg';
import {useTheme} from 'stream-chat-react-native';

import {IconProps} from '../utils/base';

export const User: React.FC<IconProps> = ({height, width}) => {
  const {
    theme: {
      colors: {grey},
    },
  } = useTheme();

  return (
    <Svg
      fill="none"
      height={height}
      viewBox={`0 0 ${height} ${width}`}
      width={width}>
      <Path
        clipRule="evenodd"
        d="M12 11a4 4 0 100-8 4 4 0 000 8zm0-2a2 2 0 100-4 2 2 0 000 4zm0 5c-5.531 0-8 3.632-8 6a1 1 0 11-2 0c0-3.632 3.531-8 10-8 6.469 0 10 4.368 10 8a1 1 0 11-2 0c0-2.368-2.469-6-8-6z"
        fill={grey}
        fillRule="evenodd"
      />
    </Svg>
  );
};
