import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const ChatIcon = (props: IconProps) => (
  <RootSvg height={114} viewBox={`0 0 ${114} ${114}`} width={114} {...props}>
    <RootPath
      d='M95 9.5H19C13.775 9.5 9.5 13.775 9.5 19V104.5L28.5 85.5H95C100.225 85.5 104.5 81.225 104.5 76V19C104.5 13.775 100.225 9.5 95 9.5ZM95 76H28.5L19 85.5V19H95V76Z'
      {...props}
    />
  </RootSvg>
);
