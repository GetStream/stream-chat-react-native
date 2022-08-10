import React from 'react';
import Svg, {Path} from 'react-native-svg';
import {useTheme} from 'stream-chat-react-native';

import {IconProps} from '../utils/base';

export const BlockUser: React.FC<IconProps> = ({height, width}) => {
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
        d="M12 11a4 4 0 100-8 4 4 0 000 8zm0-2a2 2 0 100-4 2 2 0 000 4z"
        fill={grey}
        fillRule="evenodd"
      />
      <Path
        clipRule="evenodd"
        d="M12 12c-5.531 0-8 3.632-8 6a1 1 0 11-2 0c0-3.632 3.531-8 10-8 1.995 0 3.714.412 5.14 1.1a1 1 0 11-.868 1.8c-1.137-.547-2.556-.9-4.272-.9zm9.828 3.586l-1.414-1.414L19 15.586l-1.414-1.414-1.414 1.414L17.586 17l-1.414 1.414 1.414 1.414L19 18.414l1.414 1.414 1.414-1.414L20.414 17l1.414-1.414z"
        fill={grey}
        fillRule="evenodd"
      />
    </Svg>
  );
};
