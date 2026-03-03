import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const BlockUser = (props: IconProps) => {
  return (
    <Svg viewBox='0 0 20 20' fill='none' {...props}>
      <Path
        d='M15.4507 4.54934C14.0557 3.15441 12.1287 2.29163 10.0001 2.29163C5.74289 2.29163 2.29175 5.74277 2.29175 9.99996C2.29175 12.1285 3.15453 14.0556 4.54946 15.4505M15.4507 4.54934C16.8457 5.94428 17.7084 7.87136 17.7084 9.99996C17.7084 14.2571 14.2572 17.7083 10.0001 17.7083C7.87148 17.7083 5.9444 16.8455 4.54946 15.4505M15.4507 4.54934L4.54946 15.4505'
        strokeWidth={1.5}
        strokeLinecap='round'
        {...props}
      />
    </Svg>
  );
};
