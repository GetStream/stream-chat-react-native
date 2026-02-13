import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Resend = (props: IconProps) => (
  <Svg viewBox='0 0 20 20' fill='none' {...props}>
    <Path
      d='M16.4663 12.2917C15.5224 14.9619 12.9758 16.875 9.98242 16.875C6.18547 16.875 3.10742 13.7969 3.10742 10C3.10742 6.20304 6.18547 3.125 9.98242 3.125C12.3301 3.125 13.8992 4.12865 15.4166 5.84076M16.0416 3.33333V6.04167C16.0416 6.38684 15.7618 6.66667 15.4166 6.66667H12.7083'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    />
  </Svg>
);
