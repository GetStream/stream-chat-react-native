import React from 'react';
import { Defs, LinearGradient, Stop } from 'react-native-svg';

import { IconProps, RootPath, RootSvg } from './utils/base';

export const XLSX: React.FC<IconProps> = (props) => (
  <RootSvg
    height={props.height || 40}
    viewBox={props.viewBox || '0 0 34 40'}
    width={props.width || 34}
    {...props}
  >
    <RootPath
      d='M0 4a4 4 0 014-4h19.333l10 10v26a4 4 0 01-4 4H4a4 4 0 01-4-4V4z'
      pathFill='url(#gradient)'
    />
    <RootPath
      d='M26.692 9.99a3.307 3.307 0 01-3.307-3.307V.058L33.33 9.99h-6.64z'
      pathFill='#16613F'
    />
    <RootPath
      d='M8.332 14.167h5v-2.5h-5v2.5zm5 4.166h-5v-2.5h5v2.5zm0 4.167h-5V20h5v2.5zm11.667-4.167h-10v-2.5h10v2.5zm-10 4.167h10V20h-10v2.5zm0-8.333v-2.5h10v2.5h-10z'
      pathFill='#FFFFFF'
      pathOpacity={0.4}
    />
    <RootPath
      d='M15.65 36.25h-1.19v-4.998h1.19v4.998zm-4.123 0H10.21l1.26-1.904-1.155-1.729h1.316l.51.868.512-.868h1.26l-1.134 1.708 1.288 1.925h-1.316l-.63-1.05-.595 1.05zm4.753-1.197c.035 1.015.917 1.302 1.778 1.302.819 0 1.743-.322 1.743-1.295 0-.3-.189-.833-.924-.98-.105-.023-.22-.044-.337-.065-.488-.089-1.007-.183-1.007-.46 0-.252.315-.273.511-.273.147 0 .28.028.378.091.098.063.154.161.154.315h1.099c-.042-.945-.875-1.176-1.673-1.176-.714 0-1.659.238-1.659 1.113 0 .83.674.973 1.336 1.112.119.024.237.05.351.078l.057.013c.214.047.524.116.524.372 0 .287-.329.385-.56.385a.746.746 0 01-.441-.126.488.488 0 01-.196-.406H16.28zm4.968 1.197h-1.316l1.26-1.904-1.155-1.729h1.316l.51.868.512-.868h1.26L22.5 34.325l1.288 1.925h-1.316l-.63-1.05-.595 1.05z'
      pathFill='#FFFFFF'
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
        <Stop stopColor='#529778' />
        <Stop offset={1} stopColor='#1A754C' />
      </LinearGradient>
    </Defs>
  </RootSvg>
);
