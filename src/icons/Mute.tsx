import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Mute: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M5.889 16H2a1 1 0 01-1-1V9a1 1 0 011-1h3.889l5.294-4.332a.5.5 0 01.817.387v15.89a.5.5 0 01-.817.387L5.89 16h-.001zM10 7.22L6.603 10H3v4h3.603L10 16.78V7.22zm13.95 8.316L20.414 12l3.536-3.536-1.414-1.414L19 10.586 15.464 7.05 14.05 8.464 17.586 12l-3.536 3.536 1.414 1.414L19 13.414l3.536 3.536 1.414-1.414z'
      {...props}
    />
  </RootSvg>
);
