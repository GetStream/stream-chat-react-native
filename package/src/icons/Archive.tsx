import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Archive: React.FC<IconProps> = (props) => (
  <Svg viewBox='0 0 20 20' fill='none' {...props}>
    <Path
      d='M8.33341 9.79167H11.6667M16.8751 14.2083V6.45833H3.12508V14.2083C3.12508 15.1417 3.12508 15.6085 3.30674 15.965C3.46652 16.2786 3.72149 16.5336 4.0351 16.6933C4.39161 16.875 4.85833 16.875 5.79175 16.875H14.2084C15.1418 16.875 15.6086 16.875 15.9651 16.6933C16.2787 16.5336 16.5337 16.2786 16.6934 15.965C16.8751 15.6085 16.8751 15.1417 16.8751 14.2083ZM2.29175 3.125H17.7084V6.45833H2.29175V3.125Z'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    />
  </Svg>
);
