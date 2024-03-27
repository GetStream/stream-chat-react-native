import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

type Props = IconProps;

export const Play = ({ height, width, ...rest }: Props) => (
  <Svg height={height} viewBox={`0 0 ${height} ${width}`} width={width} {...rest}>
    <Path d='M8.66602 6.66663V25.3333L23.3327 16L8.66602 6.66663Z' {...rest} />
  </Svg>
);
