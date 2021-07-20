import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Eye: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M22.819 12C21.878 6.88 17.392 3 12 3 6.608 3 2.121 6.88 1.181 12c.941 5.12 5.427 9 10.819 9 5.392 0 9.879-3.88 10.819-9zm-2.042 0A9.005 9.005 0 0112 19a9.005 9.005 0 01-8.777-7 9.005 9.005 0 0117.554 0zM12 16.5a4.5 4.5 0 112.297-8.37 2.5 2.5 0 101.573 1.573A4.5 4.5 0 0112 16.5zm3.87-6.798a2.506 2.506 0 00-1.572-1.572 4.523 4.523 0 011.572 1.572z'
      {...props}
    />
  </RootSvg>
);
