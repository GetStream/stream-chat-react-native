import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Right: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M8.306 18.694c.408.408 1.07.408 1.478 0l5.913-5.9A1.04 1.04 0 0016 11.97a1.04 1.04 0 00-.306-.761l-5.91-5.904a1.046 1.046 0 00-1.478 0 1.043 1.043 0 000 1.476l5.227 5.22-5.227 5.217a1.042 1.042 0 000 1.475z'
      {...props}
    />
  </RootSvg>
);
