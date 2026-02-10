import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const CommandsIcon = (props: IconProps) => (
  <Svg fill='none' viewBox='0 0 16 16' {...props}>
    <Path
      d='M5.75 11.5833L9.5 3.66667M2.41667 0.75H12.8333C13.7538 0.75 14.5 1.49619 14.5 2.41667V12.8333C14.5 13.7538 13.7538 14.5 12.8333 14.5H2.41667C1.49619 14.5 0.75 13.7538 0.75 12.8333V2.41667C0.75 1.49619 1.49619 0.75 2.41667 0.75Z'
      strokeWidth={1.5}
      strokeLinejoin='round'
      {...props}
    />
  </Svg>
);
