import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Flag = (props: IconProps) => (
  <Svg viewBox='0 0 20 20' fill='none' {...props}>
    <Path
      d='M3.9585 12.5697V3.66616C3.9585 3.34908 4.13787 3.05423 4.43262 2.93733C8.15655 1.46041 11.1564 4.48816 14.7842 3.60906C15.3846 3.46357 16.0418 3.87178 16.0418 4.48952V12.0519C16.0418 12.369 15.8625 12.6638 15.5677 12.7807C11.4224 14.4247 8.17433 10.487 3.9585 12.5697ZM3.9585 12.5697V17.7086'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    />
  </Svg>
);
