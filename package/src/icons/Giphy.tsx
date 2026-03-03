import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Giphy = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 24 24'} width={width} {...rest}>
    <Path
      fill-rule='evenodd'
      clip-rule='evenodd'
      d='M5.00523 2.7432H18.996V21.2568H5.00403L5.00523 2.7432Z'
      fill='black'
    />
    <Path d='M2.20801 2.0568H5.00521V21.9432H2.20801V2.0568Z' fill='#04FF8E' />
    <Path d='M18.9948 7.5432H21.792V21.9432H18.9948V7.5432Z' fill='#8E2EFF' />
    <Path d='M2.20801 21.2568H21.792V24H2.20801V21.2568Z' fill='#00C5FF' />
    <Path d='M2.20801 0H13.3992V2.7432H2.20801V0Z' fill='#FFF152' />
    <Path d='M18.9948 5.4852V2.7432H16.1964V0H13.3992V8.2284H21.792V5.4852' fill='#FF5B5B' />
    <Path d='M18.9948 10.9716V8.2284H21.792' fill='#551C99' />
    <Path fillRule='evenodd' clipRule='evenodd' d='M13.3992 0V2.7432H10.6008' fill='#999131' />
  </Svg>
);
