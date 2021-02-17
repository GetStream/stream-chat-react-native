import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const SendUp: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14v-4H8l4-4 4 4h-3v4h-2z'
      {...props}
    />
  </RootSvg>
);
