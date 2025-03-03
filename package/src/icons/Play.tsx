import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

type Props = IconProps;

export const Play = ({ height, width, ...rest }: Props) => (
  <Svg height={height} viewBox={'0 0 24 24'} width={width} {...rest}>
    <Path d='M6.5 5V19L17.5 12L6.5 5Z' {...rest} />
  </Svg>
);
