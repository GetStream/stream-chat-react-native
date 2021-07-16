import React from 'react';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const RTF: React.FC<IconProps> = (props) => (
  <RootSvg
    height={props.height || 40}
    viewBox={props.viewBox || '0 0 34 40'}
    width={props.width || 34}
    {...props}
  >
    <RootPath
      d='M0 3a3 3 0 013-3h20.333l10 10v27a3 3 0 01-3 3H3a3 3 0 01-3-3V3z'
      pathFill='#F5F5F5'
    />
    <RootPath d='M0 28h33.333v9a3 3 0 01-3 3H3a3 3 0 01-3-3v-9z' pathFill='#A8A8A8' />
    <RootPath
      d='M25.865 9.99a2.48 2.48 0 01-2.48-2.48V.058L33.33 9.99h-7.466z'
      pathFill='#DBDBDB'
    />
    <RootPath
      d='M20.403 36h-1.19v-2.863h-.574v-.77h.574c0-1.043.364-1.365 1.38-1.365.126 0 .256.006.386.013l.187.008v.84a2.57 2.57 0 00-.322-.021c-.273 0-.44.035-.44.364v.161h.713v.77h-.714V36zm-1.979-3.633h-.735v-1.099H16.5v1.1h-.601v.77h.602v1.616c0 .987.259 1.281 1.273 1.281.125 0 .248-.01.372-.018a6.69 6.69 0 01.28-.017v-.875c-.054 0-.107.004-.16.007-.05.004-.1.007-.149.007-.258 0-.427-.063-.427-.35v-1.652h.735v-.77zM13.294 36h1.19v-1.8c0-.454.309-.86.897-.86.16 0 .3.028.455.07v-1.085a1.267 1.267 0 00-.28-.028c-.511 0-.917.245-1.092.707h-.014v-.637h-1.155V36z'
      pathFill='#FFFFFF'
    />
    <RootPath
      d='M7.98 14.131v-1.66h14.962v1.661H7.98zm9.976 1.663H7.98v1.662h9.976v-1.662zM7.98 20.78h14.962v-1.66H7.98v1.662-.002z'
      pathFill='#CFCFCF'
    />
  </RootSvg>
);
