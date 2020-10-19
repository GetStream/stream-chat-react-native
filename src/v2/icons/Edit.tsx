import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Edit: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M21 21H3v-4.243L16.435 3.322a1 1 0 011.414 0l2.829 2.829a1 1 0 010 1.414L9.243 19H21v2zM5 19h1.414l9.314-9.314-1.414-1.414L5 17.586V19zM18.556 6.858l-1.414 1.414-1.414-1.414 1.414-1.414 1.414 1.414z'
      {...props}
    />
  </RootSvg>
);
