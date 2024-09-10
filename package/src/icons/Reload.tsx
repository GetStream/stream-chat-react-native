import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Reload = (props: IconProps) => (
  <RootSvg {...props}>
    <RootPath
      d='M12 4V1L8 5L12 9V6C15.31 6 18 8.69 18 12C18 13.01 17.75 13.97 17.3 14.8L18.76 16.26C19.54 15.03 20 13.57 20 12C20 7.58 16.42 4 12 4ZM12 18C8.69 18 6 15.31 6 12C6 10.99 6.25 10.03 6.7 9.2L5.24 7.74C4.46 8.97 4 10.43 4 12C4 16.42 7.58 20 12 20V23L16 19L12 15V18Z'
      {...props}
    />
  </RootSvg>
);
