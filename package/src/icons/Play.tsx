import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Play = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 20 20'} width={width} {...rest}>
    <Path
      d='M7.70327 1.97298C6.17848 0.986351 4.16666 2.08084 4.16666 3.89699V16.1032C4.16666 17.9193 6.17848 19.0138 7.70327 18.0272L17.1353 11.9241C18.5309 11.0211 18.531 8.97917 17.1353 8.07608L7.70327 1.97298Z'
      {...rest}
    />
  </Svg>
);
