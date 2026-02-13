import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const ThreadReply = (props: IconProps) => (
  <Svg viewBox='0 0 20 20' fill='none' {...props}>
    <Path
      d='M12.7084 8.125H7.29169M10.2084 11.875H7.29169M2.29169 16.875H13.5417C15.8429 16.875 17.7084 15.0095 17.7084 12.7083V7.29167C17.7084 4.99048 15.8429 3.125 13.5417 3.125H6.45835C4.15717 3.125 2.29169 4.99048 2.29169 7.29167V16.875Z'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    />
  </Svg>
);
