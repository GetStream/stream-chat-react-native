import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Search: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M11 2c4.968 0 9 4.032 9 9s-4.032 9-9 9-9-4.032-9-9 4.032-9 9-9zm0 16c3.867 0 7-3.133 7-7 0-3.868-3.133-7-7-7-3.868 0-7 3.132-7 7 0 3.867 3.132 7 7 7zm11.314 2.899l-2.829-2.828-1.414 1.414 2.828 2.829 1.415-1.415z'
      {...props}
    />
  </RootSvg>
);
