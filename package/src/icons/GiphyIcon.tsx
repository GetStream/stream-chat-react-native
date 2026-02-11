import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const GiphyIcon = (props: IconProps) => (
  <Svg viewBox='0 0 20 20' fill='none' {...props}>
    <Path
      d='M15.0801 3.03613V16.9639H4.91992L4.9209 3.03613H15.0801Z'
      fill='black'
      stroke='#414552'
      strokeWidth={1.5}
    />
    <Path d='M1.83984 1.71387H4.17084V18.2859H1.83984V1.71387Z' fill='#04FF8E' />
    <Path d='M15.8291 6.28613H18.1601V18.2861H15.8291V6.28613Z' fill='#8E2EFF' />
    <Path d='M1.83984 17.7139H18.1598V19.9999H1.83984V17.7139Z' fill='#00C5FF' />
    <Path d='M1.83984 0H11.1658V2.286H1.83984V0Z' fill='#FFF152' />
    <Path d='M15.829 4.571V2.286H13.497V0H11.166V6.857H18.16V4.571' fill='#FF5B5B' />
    <Path d='M15.8291 9.14342V6.85742H18.1601' fill='#551C99' />
    <Path fillRule='evenodd' clipRule='evenodd' d='M11.166 0V2.286H8.83398' fill='#999131' />
  </Svg>
);
