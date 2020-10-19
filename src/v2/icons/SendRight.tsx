import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const SendRight: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10 10-4.48 10-10zM8 11h4V8l4 4-4 4v-3H8v-2z'
      {...props}
    />
  </RootSvg>
);
