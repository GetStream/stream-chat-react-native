import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Play: React.FC<IconProps> = (props) => (
  <RootSvg
    height={props.height}
    viewBox={`0 0 ${props.height} ${props.width}`}
    width={props.width}
    {...props}
  >
    <RootPath
      d='M 9.5547 5.03647 C 8.89014 4.59343 8 5.06982 8 5.86852 V 18.1315 C 8 18.9302 8.89015 19.4066 9.5547 18.9635 L 18.7519 12.8321 C 19.3457 12.4362 19.3457 11.5638 18.7519 11.1679 L 9.5547 5.03647 Z'
      {...props}
    />
  </RootSvg>
);
