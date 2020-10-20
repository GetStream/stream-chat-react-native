import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Lightning: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M11.636 4H16l-2.91 5.818H16L10.546 20l1.09-7.273H8L11.636 4z'
      {...props}
    />
  </RootSvg>
);
