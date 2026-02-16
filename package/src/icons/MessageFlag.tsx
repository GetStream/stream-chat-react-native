import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const MessageFlag = (props: IconProps) => (
  <Svg viewBox='0 0 20 20' fill='none' {...props}>
    <Path
      d='M3.95831 12.5693V3.6658C3.95831 3.34872 4.13769 3.05387 4.43244 2.93697C8.15637 1.46005 11.1562 4.4878 14.7841 3.60869C15.3844 3.46321 16.0416 3.87142 16.0416 4.48916V12.0515C16.0416 12.3686 15.8623 12.6635 15.5676 12.7803C11.4222 14.4244 8.17415 10.4866 3.95831 12.5693ZM3.95831 12.5693V17.7082'
      {...props}
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </Svg>
);
