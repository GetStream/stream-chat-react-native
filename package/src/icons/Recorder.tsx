import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Recorder = ({ ...rest }: IconProps) => (
  <RootSvg viewBox={'0 0 19 12'} {...rest}>
    <RootPath
      d='M12.1914 2V10H2.19141V2H12.1914ZM13.1914 0H1.19141C0.641406 0 0.191406 0.45 0.191406 1V11C0.191406 11.55 0.641406 12 1.19141 12H13.1914C13.7414 12 14.1914 11.55 14.1914 11V7.5L18.1914 11.5V0.5L14.1914 4.5V1C14.1914 0.45 13.7414 0 13.1914 0Z'
      {...rest}
    />
  </RootSvg>
);
