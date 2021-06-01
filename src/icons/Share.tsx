import React from 'react';
import { Rect } from 'react-native-svg';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Share: React.FC<IconProps> = (props) => (
  <RootSvg {...props}>
    <RootPath
      d='M5.306 9.695a1.043 1.043 0 001.476 0l5.219-5.225 5.218 5.224a1.043 1.043 0 001.476 0 1.046 1.046 0 000-1.478l-5.904-5.91a1.04 1.04 0 00-.8-.304 1.04 1.04 0 00-.781.305l-5.904 5.91a1.046 1.046 0 000 1.478z'
      {...props}
    />
    <Rect fill={props.pathFill || '#000000'} height={16} rx={1} width={2} x={11} y={2} />
    <RootPath
      d='M4 12a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2v-6a2 2 0 00-2-2h-5v2h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4a1 1 0 011-1h4v-2H4z'
      {...props}
    />
  </RootSvg>
);
