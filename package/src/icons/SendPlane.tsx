import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const SendPlane: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M 0.0126984 27.3334 L 26.6667 14 L 0.0126984 0.666687 L 0 11.0371 L 19.0476 14 L 0 16.963 L 0.0126984 27.3334 Z'
      {...props}
    />
  </RootSvg>
);
