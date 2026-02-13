import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Copy = (props: IconProps) => (
  <Svg viewBox='0 0 17 17' fill='none' {...props}>
    <Path
      d='M5.75 5.75V1.79167C5.75 1.21637 6.21637 0.75 6.79167 0.75H15.125C15.7003 0.75 16.1667 1.21637 16.1667 1.79167V10.125C16.1667 10.7003 15.7003 11.1667 15.125 11.1667H11.1667M10.125 5.75H1.79167C1.21637 5.75 0.75 6.21637 0.75 6.79167V15.125C0.75 15.7003 1.21637 16.1667 1.79167 16.1667H10.125C10.7003 16.1667 11.1667 15.7003 11.1667 15.125V6.79167C11.1667 6.21637 10.7003 5.75 10.125 5.75Z'
      {...props}
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </Svg>
);
