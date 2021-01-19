import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Folder: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M21 5h-8.586l-2-2H3a1 1 0 00-1 1v16a1 1 0 001 1h18a1 1 0 001-1V6a1 1 0 00-1-1zM4 19V7h16v12H4z'
      {...props}
    />
  </RootSvg>
);
