import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from 'stream-chat-react-native';

import { IconProps } from '../utils/base';

export const GoBack: React.FC<IconProps> = ({ height = 24, width = 24 }) => {
  const {
    theme: {
      colors: { black },
    },
  } = useTheme();
  return (
    <Svg fill='none' height={height} viewBox={`0 0 ${height} ${width}`} width={width}>
      <Path
        clipRule='evenodd'
        d='M15.694 18.6943C16.102 18.2867 16.102 17.6259 15.694 17.2184L10.4699 12L15.694 6.78165C16.102 6.37408 16.102 5.71326 15.694 5.30568C15.2859 4.89811 14.6244 4.8981 14.2164 5.30568L8.30602 11.2096C8.08861 11.4267 7.98704 11.7158 8.00132 12.0002C7.98713 12.2844 8.0887 12.5733 8.30603 12.7904L14.2164 18.6943C14.6244 19.1019 15.2859 19.1019 15.694 18.6943Z'
        fill={black}
        fillRule='evenodd'
      />
    </Svg>
  );
};
