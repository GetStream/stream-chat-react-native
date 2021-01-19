import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const GiphyIcon: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z'
      pathFill='#000000'
      {...props}
    />
    <RootPath d='M7 7H8V17H7z' pathFill='#00FF99' {...props} />
    <RootPath d='M16 10H17V18H16z' pathFill='#9D34FF' {...props} />
    <RootPath d='M7 6H14V7H7z' pathFill='#FFFF9C' {...props} />
    <RootPath d='M7 17H16V18H7z' pathFill='#00CCFF' {...props} />
    <RootPath d='M14 6h1v1.5h1V9h1v1h-3V6z' pathFill='#FF6666' {...props} />
  </RootSvg>
);
