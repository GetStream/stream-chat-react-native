import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Delete: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M8 3a1 1 0 011-1h6a1 1 0 011 1v1h3a1 1 0 110 2H5a1 1 0 110-2h3V3zM6 7a1 1 0 011 1v11a1 1 0 001 1h8a1 1 0 001-1V8a1 1 0 112 0v11a3 3 0 01-3 3H8a3 3 0 01-3-3V8a1 1 0 011-1z'
      {...props}
    />
    <RootPath
      d='M10 8a1 1 0 011 1v8a1 1 0 11-2 0V9a1 1 0 011-1zM14 8a1 1 0 011 1v8a1 1 0 11-2 0V9a1 1 0 011-1z'
      {...props}
    />
  </RootSvg>
);
