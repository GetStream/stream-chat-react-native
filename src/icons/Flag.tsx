import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Flag: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M7.833 14.917v2.916H6.667V6.75H17.83a.292.292 0 01.253.436L16 10.833l2.084 3.647a.291.291 0 01-.253.437H7.833zm0-7v5.833h8.49l-1.667-2.917 1.667-2.916h-8.49z'
      {...props}
    />
  </RootSvg>
);
