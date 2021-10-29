import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Smile: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M12 4a8 8 0 100 16 8 8 0 000-16zM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12z'
      {...props}
    />
    <RootPath
      d='M11 9.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM16 9.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM7.426 13.18a1 1 0 011.393.247c.49.698 1.393 1.495 2.472 1.719.984.204 2.35-.02 3.966-1.815a1 1 0 111.486 1.338c-1.984 2.205-4.035 2.814-5.859 2.435-1.73-.36-3.026-1.563-3.703-2.53a1 1 0 01.245-1.393z'
      {...props}
    />
  </RootSvg>
);
