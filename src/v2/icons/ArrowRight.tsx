import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const ArrowRight: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath d='M3 12a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1z' {...props} />
    <RootPath
      d='M15.293 7.293a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414z'
      {...props}
    />
    <RootPath
      d='M20.707 11.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0z'
      {...props}
    />
  </RootSvg>
);
