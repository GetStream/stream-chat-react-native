import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

type Props = IconProps;

export const UnreadIndicator = (props: Props) => (
  <Svg viewBox='0 0 20 20' fill='none' {...props}>
    <Path
      d='M16.25 10V16.25C16.25 16.4158 16.1842 16.5747 16.0669 16.6919C15.9497 16.8092 15.7908 16.875 15.625 16.875H3.75C3.58424 16.875 3.42527 16.8092 3.30806 16.6919C3.19085 16.5747 3.125 16.4158 3.125 16.25V4.375C3.125 4.20924 3.19085 4.05027 3.30806 3.93306C3.42527 3.81585 3.58424 3.75 3.75 3.75H10M17.5 4.6875C17.5 5.89562 16.5206 6.875 15.3125 6.875C14.1044 6.875 13.125 5.89562 13.125 4.6875C13.125 3.47938 14.1044 2.5 15.3125 2.5C16.5206 2.5 17.5 3.47938 17.5 4.6875Z'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    />
  </Svg>
);
