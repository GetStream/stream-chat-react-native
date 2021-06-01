import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from 'stream-chat-react-native';

import { IconProps } from '../utils/base';

export const MentionsTab: React.FC<IconProps> = ({ active, height = 24, width = 24 }) => {
  const {
    theme: {
      colors: { black, grey },
    },
  } = useTheme();

  return (
    <Svg fill='none' height={height} viewBox={`0 0 ${height} ${width}`} width={width}>
      <Path
        clipRule='evenodd'
        d='M12 4.00086C16.4183 4.00086 20 7.58258 20 12.0009L20 13.5C20 14.3284 19.3284 15 18.5 15C17.6716 15 17 14.3284 17 13.5V7.99999H15C12.9797 6.48454 10.1464 6.71367 8.39581 8.53405C6.48172 10.5245 6.54359 13.6897 8.534 15.6038C10.5244 17.5179 13.6896 17.456 15.6037 15.4656C16.2551 16.4256 17.3398 17.0005 18.5 17.0005C20.433 17.0005 22 15.4335 22 13.5005V13.5V12C22 6.477 17.523 2 12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C13.9747 22.0032 15.9056 21.4189 17.5473 20.3215L16.4373 18.6575C15.1232 19.5334 13.5793 20.0009 12 20.0009C7.58172 20.0009 4 16.4191 4 12.0009C4 7.58258 7.58172 4.00086 12 4.00086ZM9 12C9 10.3431 10.3432 9 12 9C13.6568 9 15 10.3431 15 12C15 13.6568 13.6568 15 12 15C10.3432 15 9 13.6568 9 12Z'
        fill={active ? black : grey}
        fillRule='evenodd'
      />
    </Svg>
  );
};
