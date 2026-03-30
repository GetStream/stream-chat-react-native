import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const ChevronLeft = ({ height, size, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height ?? size} viewBox={'0 0 20 20'} width={width ?? size} {...rest}>
    <Path
      d='M12.5 16.25L6.25 10L12.5 3.75'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
