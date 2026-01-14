import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const NewClose = ({ height, width, ...rest }: IconProps) => (
  <Svg height={height} viewBox={`0 0 16 16`} width={width} {...rest}>
    <Path
      d='M5.1665 5.1665L10.8332 10.8332M10.8332 5.1665L5.1665 10.8332'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      {...rest}
    />
  </Svg>
);
