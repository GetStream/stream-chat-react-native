import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const ChevronLeft = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 20 20'} width={width} {...rest}>
    <Path
      d='M12.0833 15.2083L6.875 9.99996L12.0833 4.79163'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
