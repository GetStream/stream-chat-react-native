import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const MailOpen: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M11.445 2.168a1 1 0 011.11 0l9 6A1 1 0 0122 9v12a1 1 0 01-1 1H3a1 1 0 01-1-1V9a1 1 0 01.445-.832l9-6zM4 10.868l7.445 4.964a1 1 0 001.11 0L20 10.868V20H4v-9.132zM19.197 9L12 13.798 4.803 9 12 4.202 19.197 9z'
      {...props}
    />
  </RootSvg>
);
