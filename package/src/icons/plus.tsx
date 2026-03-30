import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Plus = ({ height, size, width, ...rest }: IconProps) => (
  <Svg height={height ?? size} viewBox={'0 0 20 20'} width={width ?? size} {...rest}>
    <Path d='M3.125 10H16.875M10 3.125V16.875' {...rest} />
  </Svg>
);
