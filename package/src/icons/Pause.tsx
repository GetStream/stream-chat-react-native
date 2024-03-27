import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

type Props = IconProps;

export const Pause = ({ height, width, ...rest }: Props) => (
  <Svg height={height} viewBox={`0 0 ${height} ${width}`} width={width} {...rest}>
    <Path
      d='M8 25.3333H13.3333V6.66663H8V25.3333ZM18.6667 6.66663V25.3333H24V6.66663H18.6667Z'
      {...rest}
    />
  </Svg>
);
