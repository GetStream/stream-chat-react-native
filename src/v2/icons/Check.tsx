import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Check: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M5.293 11.293a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414z'
      {...props}
    />
    <RootPath
      d='M18.707 7.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414-1.414l8-8a1 1 0 011.414 0z'
      {...props}
    />
  </RootSvg>
);
