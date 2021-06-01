import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const ShareRightArrow: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath d='M18 7.998l-7-7v4c-7 1-10 6-11 11 2.5-3.5 6-5.1 11-5.1v4.1l7-7z' {...props} />
  </RootSvg>
);
