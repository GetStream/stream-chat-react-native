import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const CirclePlus: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='"M11 8a1 1 0 112 0v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H8a1 1 0 110-2h3V8z'
      {...props}
    />
    <RootPath
      d='M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM4 12a8 8 0 1116 0 8 8 0 01-16 0z'
      {...props}
    />
  </RootSvg>
);
