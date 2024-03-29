import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Unknown = (props: IconProps) => (
  <RootSvg {...props}>
    <RootPath
      d='M10 19h3v3h-3v-3m2-17c5.35.22 7.68 5.62 4.5 9.67-.83 1-2.17 1.66-2.83 2.5C13 15 13 16 13 17h-3c0-1.67 0-3.08.67-4.08.66-1 2-1.59 2.83-2.25C15.92 8.43 15.32 5.26 12 5a3 3 0 00-3 3H6a6 6 0 016-6z'
      {...props}
    />
  </RootSvg>
);
