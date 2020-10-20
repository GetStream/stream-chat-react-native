import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const MenuPointHorizontal: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M8 12a2 2 0 11-4 0 2 2 0 014 0zM14 12a2 2 0 11-4 0 2 2 0 014 0zM18 14a2 2 0 100-4 2 2 0 000 4z'
      {...props}
    />
  </RootSvg>
);
