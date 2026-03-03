import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Lightning = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 12 12'} width={width} {...rest}>
    <Path
      d='M8.2266 1.16648C8.524 0.279984 7.4007 -0.417073 6.7514 0.291481L1.73231 5.76855C1.21953 6.32815 1.60932 7.24205 2.37725 7.24205H4.79225C4.87431 7.24205 4.93956 7.3243 4.91215 7.41115L3.82717 10.8489C3.54697 11.7367 4.67246 12.4136 5.3123 11.7034L10.2732 6.1964C10.7789 5.6351 10.3876 4.72846 9.6232 4.72846H7.20825C7.1253 4.72846 7.0598 4.64444 7.0891 4.5571L8.2266 1.16648Z'
      {...rest}
    />
  </Svg>
);
