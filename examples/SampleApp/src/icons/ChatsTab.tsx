import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from 'stream-chat-react-native';

import { IconProps } from '../utils/base';

export const ChatsTab: React.FC<IconProps> = ({
  active,
  height = 24,
  width = 24,
}) => {
  const {
    theme: {
      colors: { black, grey },
    },
  } = useTheme();
  return (
    <Svg
      fill='none'
      height={height}
      viewBox={`0 0 ${height} ${width}`}
      width={width}
    >
      <Path
        clipRule='evenodd'
        d='M12 5C7.46774 5 4 8.24148 4 12C4 15.7585 7.46774 19 12 19C12.6209 19 13.224 18.9381 13.8023 18.8215C13.9231 18.7971 14.0473 18.7953 14.1687 18.8161L19.4315 19.717L18.3869 17.0167C18.258 16.6833 18.3168 16.3064 18.5412 16.0282C19.4673 14.8799 20 13.4904 20 12C20 8.24148 16.5323 5 12 5ZM2 12C2 6.92196 6.59113 3 12 3C17.4089 3 22 6.92196 22 12C22 13.7774 21.4276 15.4282 20.4527 16.8133L21.9327 20.6392C22.0625 20.9749 22.0019 21.3545 21.774 21.6332C21.5461 21.9118 21.1861 22.0464 20.8313 21.9857L14.0104 20.8181C13.3601 20.9375 12.6877 21 12 21C6.59113 21 2 17.078 2 12Z'
        fill={active ? black : grey}
        fillRule='evenodd'
      />
    </Svg>
  );
};
