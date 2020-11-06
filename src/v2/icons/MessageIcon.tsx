import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const MessageIcon: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M12 5c-4.532 0-8 3.241-8 7 0 3.758 3.468 7 8 7 .62 0 1.224-.062 1.802-.178a.999.999 0 01.367-.006l5.262.901-1.044-2.7a1 1 0 01.154-.989C19.467 14.88 20 13.49 20 12c0-3.759-3.468-7-8-7zM2 12c0-5.078 4.591-9 10-9s10 3.922 10 9c0 1.777-.572 3.428-1.547 4.813l1.48 3.826a1 1 0 01-1.102 1.347l-6.82-1.168c-.65.12-1.323.182-2.011.182-5.409 0-10-3.922-10-9z'
      {...props}
    />
  </RootSvg>
);
