import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Error: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-2V7h2v6h-2z'
      {...props}
    />
  </RootSvg>
);
