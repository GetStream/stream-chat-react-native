import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Stop: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M 14 0.666687 C 6.41 0.666687 0.25 6.64002 0.25 14 C 0.25 21.36 6.41 27.3334 14 27.3334 C 21.59 27.3334 27.75 21.36 27.75 14 C 27.75 6.64002 21.59 0.666687 14 0.666687 Z M 14 24.6667 C 7.9225 24.6667 3 19.8934 3 14 C 3 8.10669 7.9225 3.33335 14 3.33335 C 20.0775 3.33335 25 8.10669 25 14 C 25 19.8934 20.0775 24.6667 14 24.6667 Z M 19.5 19.3334 H 8.5 V 8.66669 H 19.5 V 19.3334 Z'
      {...props}
    />
  </RootSvg>
);
