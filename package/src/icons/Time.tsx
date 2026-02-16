import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Time = ({ height, width, ...rest }: IconProps) => (
  <Svg viewBox='0 0 12 12' fill='none' height={height} width={width} {...rest}>
    <Path
      d='M6 3.875V6L7.375 7.375M10.625 6C10.625 8.5543 8.5543 10.625 6 10.625C3.44568 10.625 1.375 8.5543 1.375 6C1.375 3.44568 3.44568 1.375 6 1.375C8.5543 1.375 10.625 3.44568 10.625 6Z'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...rest}
    />
  </Svg>
);
