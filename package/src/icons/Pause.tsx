import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

type Props = IconProps;

export const Pause = ({ height, width, ...rest }: Props) => (
  <Svg height={height} viewBox={'0 0 24 24'} width={width} {...rest}>
    <Path d='M6 19H10V5H6V19ZM14 5V19H18V5H14Z' {...rest} />
  </Svg>
);
