import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Stop = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 20 20'} width={width}>
    <Path
      d='M16.25 6.25C16.25 4.86929 15.1307 3.75 13.75 3.75L6.25 3.75C4.86929 3.75 3.75 4.86929 3.75 6.25V13.75C3.75 15.1307 4.86928 16.25 6.24999 16.25L13.75 16.25C15.1307 16.25 16.25 15.1307 16.25 13.75V6.25Z'
      {...rest}
    />
  </Svg>
);
