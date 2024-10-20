import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const PollThumbnail = (props: IconProps) => (
  <RootSvg {...props}>
    <RootPath
      d='M16 0H2C0.9 0 0 0.9 0 2V16C0 17.1 0.9 18 2 18H16C17.1 18 18 17.1 18 16V2C18 0.9 17.1 0 16 0ZM16 16H2V2H16V16ZM4 7H6V14H4V7ZM8 4H10V14H8V4ZM12 10H14V14H12V10Z'
      {...props}
    />
  </RootSvg>
);
