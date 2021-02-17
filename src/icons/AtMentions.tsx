import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const AtMentions: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M12 4a8 8 0 018 8v1.5a1.5 1.5 0 01-3 0V8h-2a5 5 0 10.604 7.466A3.5 3.5 0 0022 13.5V12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10a9.953 9.953 0 005.547-1.678l-1.11-1.665A8 8 0 1112 4.001zm-3 8a3 3 0 116 0 3 3 0 01-6 0z'
      {...props}
    />
  </RootSvg>
);
