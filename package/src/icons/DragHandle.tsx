import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const DragHandle = (props: IconProps) => (
  <RootSvg viewBox='0 0 16 6' {...props}>
    <RootPath d='M16 0H0V2H16V0ZM0 6H16V4H0V6Z' {...props} />
  </RootSvg>
);
