import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Notification: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath d='M14 5a2 2 0 11-4 0 2 2 0 014 0z' {...props} />
    <RootPath
      d='M16 16v-5a4 4 0 00-8 0v5h8zM12 5a6 6 0 00-6 6v7h12v-7a6 6 0 00-6-6z'
      {...props}
    />
    <RootPath
      d='M4 17a1 1 0 011-1h14a1 1 0 110 2H5a1 1 0 01-1-1zM10 19a2 2 0 104 0h-4z'
      {...props}
    />
  </RootSvg>
);
