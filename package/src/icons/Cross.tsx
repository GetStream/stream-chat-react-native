import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Cross = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 16 16'} width={width} {...rest}>
    <Path
      d='M4.1665 4.1665L11.8332 11.8332M11.8332 4.1665L4.1665 11.8332'
      strokeLinecap='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
