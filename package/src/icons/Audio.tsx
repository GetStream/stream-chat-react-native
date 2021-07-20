import React from 'react';
import { Defs, LinearGradient, Stop } from 'react-native-svg';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const Audio: React.FC<IconProps> = (props) => (
  <RootSvg
    height={props.height || 40}
    viewBox={props.viewBox || '0 0 34 40'}
    width={props.width || 34}
    {...props}
  >
    <RootPath
      d='M0 3a3 3 0 013-3h20.333l10 10v27a3 3 0 01-3 3H3a3 3 0 01-3-3V3z'
      pathFill='url(#gradient)'
    />
    <RootPath
      d='M9.88 23.941h3.418l4.654 3.808a.44.44 0 00.718-.34V13.44a.44.44 0 00-.718-.34l-4.654 3.809H9.879a.88.88 0 00-.879.88v5.274c0 .485.394.879.88.879zm4.046-5.275l2.986-2.444v8.405l-2.986-2.444h-3.168v-3.517h3.168zm6.925-.314c-.377.057-.611.312-.523.567l-.002.001a5.3 5.3 0 01.302 1.775 5.426 5.426 0 01-.308 1.796c-.091.255.148.509.527.569.054.008.107.012.16.012.319 0 .609-.149.685-.366a6.27 6.27 0 00.345-2.01 6.157 6.157 0 00-.341-1.993c-.09-.255-.467-.412-.845-.351zm2.31-1.75c.364-.086.765.043.894.292A8.206 8.206 0 0125 20.692c0 1.297-.32 2.592-.948 3.823-.102.197-.376.32-.67.32-.075 0-.152-.009-.228-.026-.368-.084-.563-.355-.436-.601.58-1.132.874-2.324.875-3.516 0-1.186-.288-2.37-.865-3.49-.128-.246.067-.516.432-.6z'
      pathFill='#CFCFCF'
    />
    <RootPath
      d='M25.865 9.99a2.48 2.48 0 01-2.48-2.48V.058L33.33 9.99h-7.466z'
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
