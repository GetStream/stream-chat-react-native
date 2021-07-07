import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Copy: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M7 6V3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1h-3v3c0 .552-.45 1-1.007 1H4.007A1.001 1.001 0 013 21.005V21l.003-14c0-.552.45-1 1.007-1H7zM5.003 8L5 20h10V8H5.003zM17 6H9V4h10v12h-2V6z'
      {...props}
    />
  </RootSvg>
);
