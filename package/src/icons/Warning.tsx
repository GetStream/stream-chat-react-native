import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Warning: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM7 11V13H9V11H7ZM7 9V3H9V9H7Z'
      {...props}
    />
  </RootSvg>
);
