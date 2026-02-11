import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const PollThumbnail = (props: IconProps) => (
  <Svg viewBox='0 0 16 16' fill='none' {...props}>
    <Path
      d='M5.33333 14.5V9.08333H1.58333C1.1231 9.08333 0.75 9.45642 0.75 9.91667V13.6667C0.75 14.1269 1.1231 14.5 1.58333 14.5H5.33333ZM5.33333 14.5H9.91667M5.33333 14.5V1.58333C5.33333 1.1231 5.70643 0.75 6.16667 0.75H9.08333C9.54358 0.75 9.91667 1.1231 9.91667 1.58333V14.5M9.91667 14.5H14.0833C14.3134 14.5 14.5 14.3134 14.5 14.0833V5.75C14.5 5.28977 14.1269 4.91667 13.6667 4.91667H9.91667V14.5Z'
      {...props}
    />
  </Svg>
);
