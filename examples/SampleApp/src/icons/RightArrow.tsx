import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from 'stream-chat-react-native';

import { IconProps } from '../utils/base';

export const RightArrow: React.FC<IconProps> = ({ active, height, width }) => {
  const {
    theme: {
      colors: { accent_blue },
    },
  } = useTheme();

  return (
    <Svg fill='none' height={height} viewBox={`0 0 ${height} ${width}`} width={width}>
      <Path
        clipRule='evenodd'
        d='M3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12Z'
        fill={accent_blue}
        fillRule='evenodd'
      />
      <Path
        clipRule='evenodd'
        d='M15.2929 7.29289C15.6834 6.90237 16.3166 6.90237 16.7071 7.29289L20.7071 11.2929C21.0976 11.6834 21.0976 12.3166 20.7071 12.7071C20.3166 13.0976 19.6834 13.0976 19.2929 12.7071L15.2929 8.70711C14.9024 8.31658 14.9024 7.68342 15.2929 7.29289Z'
        fill={accent_blue}
        fillRule='evenodd'
      />
      <Path
        clipRule='evenodd'
        d='M20.7071 11.2929C21.0976 11.6834 21.0976 12.3166 20.7071 12.7071L16.7071 16.7071C16.3166 17.0976 15.6834 17.0976 15.2929 16.7071C14.9024 16.3166 14.9024 15.6834 15.2929 15.2929L19.2929 11.2929C19.6834 10.9024 20.3166 10.9024 20.7071 11.2929Z'
        fill={accent_blue}
        fillRule='evenodd'
      />
    </Svg>
  );
};
