import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const CurveLineLeftUp: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M4 8a1 1 0 011-1c3.992 0 6.34.122 7.954.459 1.704.355 2.592.95 3.646 1.741a1 1 0 01.058.047c1.036.906 2.14 2 2.974 3.564C20.47 14.38 21 16.36 21 19a1 1 0 11-2 0c0-2.36-.47-4.006-1.132-5.248-.66-1.237-1.544-2.138-2.498-2.975-.929-.695-1.542-1.094-2.824-1.36C11.16 9.126 9.008 9 5 9a1 1 0 01-1-1z'
      {...props}
    />
    <RootPath
      d='M4.293 8.707a1 1 0 010-1.414l3-3a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0z'
      {...props}
    />
    <RootPath
      d='M4.293 7.293a1 1 0 011.414 0l3 3a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414z'
      {...props}
    />
  </RootSvg>
);
