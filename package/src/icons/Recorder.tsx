import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Recorder = ({ ...props }: IconProps) => (
  <Svg viewBox='0 0 12 12' fill='none' strokeWidth={1} {...props}>
    <Path
      fillRule='evenodd'
      clipRule='evenodd'
      d='M1 3.375C1 2.61561 1.61561 2 2.375 2H6.625C7.3844 2 8 2.61561 8 3.375V4.39346L9.7337 3.52661C10.3155 3.23571 11 3.65878 11 4.30924V7.6912C11 8.34165 10.3155 8.7647 9.7337 8.4738L8 7.607V8.625C8 9.3844 7.3844 10 6.625 10H2.375C1.61561 10 1 9.3844 1 8.625V3.375Z'
      fill='white'
      {...props}
      strokeWidth={1}
    />
  </Svg>
);
