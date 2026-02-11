import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const FilePickerIcon = (props: IconProps) => (
  <Svg fill='none' viewBox='0 0 14 17' strokeWidth={1.5} {...props}>
    <Path
      d='M7.41667 1.16667V4.5C7.41667 5.42047 8.16283 6.16667 9.08333 6.16667H12.4167M6.72633 0.75H2.41667C1.49619 0.75 0.75 1.49619 0.75 2.41667V14.5C0.75 15.4205 1.49619 16.1667 2.41667 16.1667H11.1667C12.0872 16.1667 12.8333 15.4205 12.8333 14.5V6.857C12.8333 6.41499 12.6578 5.99108 12.3452 5.67851L7.90483 1.23816C7.59225 0.925592 7.16833 0.75 6.72633 0.75Z'
      strokeWidth={1.5}
      strokeLinejoin='round'
      {...props}
    />
  </Svg>
);
