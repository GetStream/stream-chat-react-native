import React from 'react';
import Svg, { G, Path } from 'react-native-svg';

import { IconProps } from '../utils/base';

export const File: React.FC<IconProps> = ({ height = 20, width = 20, ...rest }) => {
  return (
    <Svg fill='none' height={height} viewBox={`0 0 ${height} ${width}`} width={width}>
      <G>
        <Path
          d='M2.5 4.79167V14.375C2.5 15.2955 3.24619 16.0417 4.16667 16.0417H16.25C17.1705 16.0417 17.9167 15.2955 17.9167 14.375V7.29167C17.9167 6.37119 17.1705 5.625 16.25 5.625H11.1003C10.5431 5.625 10.0227 5.3465 9.71358 4.88283L9.03642 3.86717C8.72733 3.4035 8.20695 3.125 7.64969 3.125H4.16667C3.24619 3.125 2.5 3.87119 2.5 4.79167Z'
          strokeWidth={1.5}
          strokeLinejoin='round'
          strokeLinecap='round'
          {...rest}
        />
      </G>
    </Svg>
  );
};
