import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const CircleRight: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-2a8 8 0 100-16 8 8 0 000 16z'
      {...props}
    />
    <RootPath
      d='M9.282 16.72a.949.949 0 010-1.348L12.68 12 9.282 8.628a.949.949 0 010-1.349.966.966 0 011.359 0l4.078 4.047a.947.947 0 010 1.348l-4.078 4.047a.967.967 0 01-1.36 0z'
      {...props}
    />
  </RootSvg>
);
