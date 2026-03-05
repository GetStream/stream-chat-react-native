import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Pause = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 20 20'} width={width} {...rest}>
    <Path
      d='M5.62501 2.5C4.35936 2.5 3.33334 3.52602 3.33334 4.79167V15.2083C3.33334 16.474 4.35936 17.5 5.62501 17.5H6.04168C7.30733 17.5 8.33334 16.474 8.33334 15.2083V4.79167C8.33334 3.52602 7.30733 2.5 6.04168 2.5H5.62501Z'
      {...rest}
    />
    <Path
      d='M13.9583 2.5C12.6927 2.5 11.6667 3.52602 11.6667 4.79167V15.2083C11.6667 16.474 12.6927 17.5 13.9583 17.5H14.375C15.6407 17.5 16.6667 16.474 16.6667 15.2083V4.79167C16.6667 3.52602 15.6407 2.5 14.375 2.5H13.9583Z'
      {...rest}
    />
  </Svg>
);
