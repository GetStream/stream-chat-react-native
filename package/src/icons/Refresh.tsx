import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Refresh: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M12.868 4.221a8 8 0 102.834 14.251 1 1 0 00-1.175-1.618A6 6 0 1112.4 6.166c1.31.314 2.52.803 3.31 2.12.154.254.266.485.348.708h-1.152a1 1 0 00-.81 1.585l2.375 3.291a1 1 0 001.621 0l2.376-3.291a1 1 0 00-.811-1.585h-1.509c-.128-.639-.377-1.24-.867-1.947a8 8 0 00-4.414-2.826z'
      {...props}
    />
  </RootSvg>
);
