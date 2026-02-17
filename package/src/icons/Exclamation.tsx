import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Exclamation = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={`0 0 ${width} ${height}`} width={width} {...rest}>
    <Path
      d='M0 9C0 8.33724 0.53724 7.8 1.2 7.8C1.86276 7.8 2.4 8.33724 2.4 9C2.39987 9.66253 1.86268 10.2 1.2 10.2C0.537322 10.2 0.000132352 9.66253 0 9Z'
      {...rest}
    />
    <Path
      d='M0.3 0.9C0.3 0.402936 0.70296 0 1.2 0C1.69704 0 2.1 0.402936 2.1 0.9V5.7C2.09987 6.19693 1.69696 6.6 1.2 6.6C0.703041 6.6 0.300133 6.19693 0.3 5.7V0.9Z'
      {...rest}
    />
  </Svg>
);
