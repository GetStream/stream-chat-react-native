import React from 'react';
import { Path, Rect } from 'react-native-svg';

import { IconProps, RootSvg } from './utils/base';

export const OtherFileIcon = (props: IconProps) => (
  <RootSvg
    height={props.height || 40}
    viewBox={props.viewBox || '0 0 32 40'}
    width={props.width || 32}
    {...props}
  >
    <Path
      d='M0 4C0 1.79086 1.79086 0 4 0H22.4L32 10V36C32 38.2091 30.2091 40 28 40H4C1.79086 40 0 38.2091 0 36V4Z'
      fill='#888888'
    />
    <Path opacity='0.5' d='M32 10H25.4C23.7431 10 22.4 8.65685 22.4 7V0L32 10Z' fill='white' />
    <Rect x='8' y='13.2' width='14.4' height='1.6' rx='0.8' fill='white' />
    <Rect x='8' y='21.2' width='14.4' height='1.6' rx='0.8' fill='white' />
    <Rect x='8' y='17.2' width='9.6' height='1.6' rx='0.8' fill='white' />
  </RootSvg>
);
