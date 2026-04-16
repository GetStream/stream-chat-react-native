import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const ReplyConnectorLeft = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 16 48'} width={width} {...rest}>
    <Path d='M16 36C7.43959 36 0.5 29.0604 0.5 20.5L0.5 0' {...rest} />
  </Svg>
);
