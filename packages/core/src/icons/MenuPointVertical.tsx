import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const MenuPointVertical: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M12 8a2 2 0 110-4 2 2 0 010 4zM12 14a2 2 0 110-4 2 2 0 010 4zM12 20a2 2 0 110-4 2 2 0 010 4z'
      {...props}
    />
  </RootSvg>
);
