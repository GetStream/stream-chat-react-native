import React from 'react';
import Svg, {G, Path} from 'react-native-svg';
import {useTheme} from 'stream-chat-react-native';

import {IconProps} from '../utils/base';

export const SignOut: React.FC<IconProps> = ({height, width}) => {
  const {
    theme: {
      colors: {black},
    },
  } = useTheme();
  return (
    <Svg
      fill="none"
      height={height}
      viewBox={`0 0 ${height} ${width}`}
      width={width}>
      <G opacity="0.5">
        <Path
          clipRule="evenodd"
          d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7ZM14 7C14 8.10457 13.1046 9 12 9C10.8954 9 10 8.10457 10 7C10 5.89543 10.8954 5 12 5C13.1046 5 14 5.89543 14 7Z"
          fill={black}
          fillRule="evenodd"
        />
        <Path
          clipRule="evenodd"
          d="M4 20C4 17.6324 6.4686 14 12 14C17.5314 14 20 17.6324 20 20C20 20.5523 20.4477 21 21 21C21.5523 21 22 20.5523 22 20C22 16.3676 18.4686 12 12 12C5.5314 12 2 16.3676 2 20C2 20.5523 2.44771 21 3 21C3.55228 21 4 20.5523 4 20Z"
          fill={black}
          fillRule="evenodd"
        />
      </G>
    </Svg>
  );
};
