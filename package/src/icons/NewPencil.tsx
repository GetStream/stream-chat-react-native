import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const NewPencil = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 12 12'} width={width} {...rest}>
    <Path
      d='M8.875 5.37483L10.2929 3.95696C10.6834 3.56643 10.6834 2.93327 10.2929 2.54274L9.4571 1.70695C9.0666 1.31643 8.4334 1.31643 8.0429 1.70696L6.625 3.12485M8.875 5.37483L3.9179 10.332C3.73036 10.5195 3.476 10.6248 3.21078 10.6248H1.375V8.78908C1.375 8.52383 1.48035 8.26948 1.66789 8.08198L6.625 3.12485M8.875 5.37483L6.625 3.12485'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.2}
      {...rest}
    />
  </Svg>
);
