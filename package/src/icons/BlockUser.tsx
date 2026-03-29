import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const BlockUser = (props: IconProps) => {
  return (
    <Svg viewBox='0 0 20 20' fill='none' {...props}>
      <Path
        d='M15.3031 15.3031L4.69688 4.69688M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z'
        strokeWidth={1.5}
        strokeLinecap='round'
        {...props}
      />
    </Svg>
  );
};
