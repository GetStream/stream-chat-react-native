import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Bookmark = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 16 16'} width={width} {...rest}>
    <Path
      d='M12.8333 13.5017V3.16732C12.8333 2.43094 12.2364 1.83398 11.5 1.83398H4.50001C3.76363 1.83398 3.16667 2.43094 3.16667 3.16732V13.5017C3.16667 14.0355 3.76277 14.3527 4.2056 14.0547L7.25547 12.0018C7.70561 11.6989 8.29441 11.6989 8.74454 12.0018L11.7944 14.0547C12.2373 14.3528 12.8333 14.0355 12.8333 13.5017Z'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
