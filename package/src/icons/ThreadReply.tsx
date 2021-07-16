import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const ThreadReply: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M4 5a1 1 0 000 2h16a1 1 0 100-2H4zm-1 7a1 1 0 011-1h9a1 1 0 110 2H4a1 1 0 01-1-1zm7 6a1 1 0 011-1h9a1 1 0 110 2h-9a1 1 0 01-1-1z'
      {...props}
    />
  </RootSvg>
);
