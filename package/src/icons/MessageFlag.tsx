import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const MessageFlag: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M5 2.5a1 1 0 00-1 1v18a1 1 0 102 0v-7h14l-2-5 2-5H6v-1a1 1 0 00-1-1zm1 4v6h11l-1-3 1-3H6z'
      {...props}
    />
  </RootSvg>
);
