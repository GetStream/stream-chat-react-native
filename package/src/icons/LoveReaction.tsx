import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const LoveReaction: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M12 21c.908.034 7.233-4.051 9.135-8.146 1.154-2.484 1.153-4.793-.003-6.503C20.136 4.879 18.396 4 16.478 4 13.712 4 12.575 6.684 12 6.684 11.425 6.684 10.422 4 7.523 4c-1.92 0-3.66.879-4.655 2.35-1.156 1.71-1.157 4.02-.003 6.505C4.767 16.948 11.092 20.966 12 21z'
      {...props}
    />
  </RootSvg>
);
