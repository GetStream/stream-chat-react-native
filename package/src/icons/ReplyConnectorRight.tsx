import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const ReplyConnectorRight = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 16 48'} width={width} {...rest}>
    <Path d='M15.5 0V20.5C15.5 29.0604 8.56041 36 0 36' {...rest} />
  </Svg>
);
