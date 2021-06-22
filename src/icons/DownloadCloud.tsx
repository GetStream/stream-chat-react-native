import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const DownloadCloud: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M12 6a5.003 5.003 0 00-4.729 3.37 1 1 0 01-.812.666A4.001 4.001 0 007 18a1 1 0 110 2A6 6 0 015.598 8.165a7 7 0 0113.343 1.923A5.002 5.002 0 0118 20a1 1 0 110-2 3 3 0 100-6 1 1 0 01-1-1 5 5 0 00-5-5z'
      {...props}
    />
    <RootPath d='M12 12a1 1 0 00-1 1v6a1 1 0 102 0v-6a1 1 0 00-1-1z' {...props} />
    <RootPath
      d='M9.293 16.293a1 1 0 000 1.414l2 2a1 1 0 001.414-1.414l-2-2a1 1 0 00-1.414 0z'
      {...props}
    />
    <RootPath
      d='M11.293 19.707a1 1 0 001.414 0l2-2a1 1 0 00-1.414-1.414l-2 2a1 1 0 000 1.414z'
      {...props}
    />
  </RootSvg>
);
