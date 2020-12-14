import React from 'react';
import { Defs, LinearGradient, Stop } from 'react-native-svg';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const GenericFile: React.FC<IconProps> = (props) => (
  <RootSvg
    height={props.height || 40}
    viewBox={props.viewBox || '0 0 34 40'}
    width={props.width || 34}
    {...props}
  >
    <RootPath
      d='M0 3.99A3.99 3.99 0 013.99 0h19.285l9.975 9.975V35.91a3.99 3.99 0 01-3.99 3.99H3.99A3.99 3.99 0 010 35.91V3.99z'
      pathFill='url(#gradient)'
    />
    <RootPath
      d='M7.98 14.131v-1.66h14.962v1.661H7.98zm9.976 1.663H7.98v1.662h9.976v-1.662zM7.98 20.78h14.962v-1.66H7.98v1.662-.002z'
      pathFill='#CFCFCF'
    />
    <RootPath
      d='M26.624 9.965a3.298 3.298 0 01-3.298-3.299V.058l9.92 9.907h-6.622z'
      pathFill='#DBDBDB'
    />
    <Defs>
      <LinearGradient
        gradientUnits='userSpaceOnUse'
        id='gradient'
        x1={0}
        x2={0}
        y1={0}
        y2={props.height || 40}
      >
        <Stop stopColor='#FFFFFF' />
        <Stop offset={1} stopColor='#DBDBDB' />
      </LinearGradient>
    </Defs>
  </RootSvg>
);
