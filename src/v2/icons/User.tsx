import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const User: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M16 7a4 4 0 11-8 0 4 4 0 018 0zm-2 0a2 2 0 11-4 0 2 2 0 014 0zM4 20c0-2.368 2.469-6 8-6 5.531 0 8 3.632 8 6a1 1 0 102 0c0-3.632-3.531-8-10-8-6.469 0-10 4.368-10 8a1 1 0 102 0z'
      {...props}
    />
  </RootSvg>
);
