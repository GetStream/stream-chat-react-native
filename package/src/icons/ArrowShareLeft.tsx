import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const ArrowShareLeft = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 20 20'} width={width} {...rest}>
    <Path
      d='M1.53764 9.54198L8.32555 3.26313C8.72579 2.89294 9.37496 3.17678 9.37496 3.72194V6.66743C9.37496 6.89755 9.56496 7.08372 9.79504 7.08738C16.5328 7.19454 18.3333 9.93457 18.3333 16.8757C17.1085 14.4262 16.4838 12.9767 9.79588 12.9192C9.56571 12.9172 9.37496 13.104 9.37496 13.3341V16.2796C9.37496 16.8247 8.72579 17.1086 8.32555 16.7384L1.53764 10.4596C1.27017 10.2121 1.27017 9.7894 1.53764 9.54198Z'
      strokeLinejoin='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
