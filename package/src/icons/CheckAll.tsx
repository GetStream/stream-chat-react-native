import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const CheckAll: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M2.293 11.293a1 1 0 011.414 0l4 4a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414zM9.293 12.293a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414z'
      {...props}
    />
    <RootPath
      d='M15.707 7.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414-1.414l8-8a1 1 0 011.414 0zM21.707 7.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414-1.414l8-8a1 1 0 011.414 0z'
      {...props}
    />
  </RootSvg>
);
