import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const NewDown = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={`0 0 20 20`} width={width} {...rest}>
    <Path
      d='M15.2084 11.6667L10.0001 16.875L4.79175 11.6667M10.0001 16.25V3.125'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
