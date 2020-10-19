import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Close: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M7.05 7.05a1 1 0 000 1.414L10.586 12 7.05 15.536a1 1 0 101.414 1.414L12 13.414l3.536 3.536a1 1 0 001.414-1.414L13.414 12l3.536-3.536a1 1 0 00-1.414-1.414L12 10.586 8.464 7.05a1 1 0 00-1.414 0z'
      {...props}
    />
  </RootSvg>
);
