import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Down: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M5.305 8.306a1.046 1.046 0 000 1.478l5.904 5.91c.228.228.536.33.834.302.27 0 .539-.101.744-.306l5.907-5.907a1.044 1.044 0 10-1.477-1.477l-5.22 5.22-5.216-5.22a1.043 1.043 0 00-1.476 0z'
      {...props}
    />
  </RootSvg>
);
