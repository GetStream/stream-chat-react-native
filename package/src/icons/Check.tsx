import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Check = ({ height, width, ...rest }: IconProps) => (
  <Svg viewBox='0 0 20 20' fill='none' height={height} width={width} {...rest}>
    <Path
      d='M6.45833 10.8856L9.11458 13.5418L13.5417 6.4585'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...rest}
    />
  </Svg>
);
