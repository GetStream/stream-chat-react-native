import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const NewMapPin = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={`0 0 12 12`} width={width} {...rest}>
    <Path
      d='M7.375 5C7.375 5.7594 6.7594 6.375 6 6.375C5.2406 6.375 4.625 5.7594 4.625 5C4.625 4.24061 5.2406 3.625 6 3.625C6.7594 3.625 7.375 4.24061 7.375 5Z'
      strokeLinejoin='round'
      strokeWidth={1.2}
      {...rest}
    />
    <Path
      d='M9.625 5C9.625 7.27735 7.58765 9.34165 6.5677 10.2324C6.2389 10.5196 5.7611 10.5196 5.4323 10.2324C4.41236 9.34165 2.375 7.27735 2.375 5C2.375 2.99797 3.99797 1.375 6 1.375C8.00205 1.375 9.625 2.99797 9.625 5Z'
      strokeLinejoin='round'
      strokeWidth={1.2}
      {...rest}
    />
  </Svg>
);
