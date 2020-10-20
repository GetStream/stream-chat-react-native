import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Camera: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M15 3H9L7 5H3a1 1 0 00-1 1v14a1 1 0 001 1h18a1 1 0 001-1V6a1 1 0 00-1-1h-4l-2-2zM7.828 7l2-2h4.344l2 2H20v12H4V7h3.828zM12 18a5.5 5.5 0 110-11 5.5 5.5 0 010 11zm3.5-5.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z'
      {...props}
    />
  </RootSvg>
);
