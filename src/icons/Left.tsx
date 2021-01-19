import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Left: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M15.694 18.694a1.043 1.043 0 000-1.476L10.47 12l5.224-5.218a1.043 1.043 0 000-1.476 1.046 1.046 0 00-1.478 0l-5.91 5.904a1.04 1.04 0 00-.305.79 1.04 1.04 0 00.305.79l5.91 5.904c.408.408 1.07.408 1.478 0z'
      {...props}
    />
  </RootSvg>
);
