import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const ArrowShareRight = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 20 20'} width={width} {...rest}>
    <Path
      d='M18.1328 9.54003L11.3449 3.26118C10.9446 2.89099 10.2954 3.17483 10.2954 3.71999V6.66548C10.2954 6.89559 10.1054 7.08177 9.87536 7.08543C3.13761 7.19259 1.3371 9.93261 1.3371 16.8738C2.56188 14.4243 3.18662 12.9748 9.87452 12.9173C10.1046 12.9153 10.2954 13.102 10.2954 13.3321V16.2776C10.2954 16.8228 10.9446 17.1066 11.3449 16.7364L18.1328 10.4576C18.4002 10.2102 18.4002 9.78745 18.1328 9.54003Z'
      strokeLinejoin='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
