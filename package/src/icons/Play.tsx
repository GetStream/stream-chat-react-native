import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Play: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath d='M0.5 0V14L11.5 7L0.5 0Z' fill='black' {...props} />
  </RootSvg>
);
