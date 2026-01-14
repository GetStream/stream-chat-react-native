import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const NewPlus = ({ height, width, ...rest }: IconProps) => (
  <Svg height={height} viewBox={`0 0 20 20`} width={width} {...rest}>
    <Path d='M10 3.125V10M10 10V16.875M10 10H3.125M10 10H16.875' {...rest} />
  </Svg>
);
