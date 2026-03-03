import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Lock = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 20 20'} width={width} {...rest}>
    <Path
      d='M13.5418 8.125V6.04167C13.5418 4.08566 11.9562 2.5 10.0002 2.5C8.04415 2.5 6.4585 4.08566 6.4585 6.04167V8.125M10.0002 11.6667V14.1667M3.9585 9.79167C3.9585 8.87117 4.70469 8.125 5.62516 8.125H14.3752C15.2957 8.125 16.0418 8.87117 16.0418 9.79167V16.0417C16.0418 16.9622 15.2957 17.7083 14.3752 17.7083H5.62516C4.70469 17.7083 3.9585 16.9622 3.9585 16.0417V9.79167Z'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
