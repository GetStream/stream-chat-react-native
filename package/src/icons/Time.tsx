import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Time: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath d='M12 9a1 1 0 112 0v4a1 1 0 01-1 1H9a1 1 0 110-2h3V9z' {...props} />
    <RootPath
      d='M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10zm-2 0a8 8 0 11-16 0 8 8 0 0116 0z'
      {...props}
    />
  </RootSvg>
);
