import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const DownloadArrow: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M12 3a1 1 0 00-1 1v9.529L6.782 9.306a1.043 1.043 0 00-1.476 0 1.046 1.046 0 000 1.478l5.904 5.91c.217.217.506.319.79.305.284.014.573-.088.79-.305l5.904-5.91a1.046 1.046 0 000-1.478 1.043 1.043 0 00-1.476 0L13 13.529V4a1 1 0 00-1-1zM5 20a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1z'
      {...props}
    />
  </RootSvg>
);
