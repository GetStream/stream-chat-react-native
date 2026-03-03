import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Unlock = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 20 20'} width={width} {...rest}>
    <Path
      d='M9.99992 11.6667V14.1667M6.45825 8.12502V5.83335C6.45825 3.87735 8.04391 2.29169 9.99992 2.29169C11.7438 2.29169 13.1933 3.552 13.4872 5.21144M3.95825 9.79169C3.95825 8.87119 4.70444 8.12502 5.62492 8.12502H14.3749C15.2954 8.12502 16.0416 8.87119 16.0416 9.79169V16.0417C16.0416 16.9622 15.2954 17.7084 14.3749 17.7084H5.62492C4.70444 17.7084 3.95825 16.9622 3.95825 16.0417V9.79169Z'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
