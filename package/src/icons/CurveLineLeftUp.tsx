import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const CurveLineLeftUp = (props: IconProps) => (
  <Svg viewBox='0 0 20 20' fill='none' {...props}>
    <Path
      d='M1.5377 9.54119L8.32561 3.26234C8.72586 2.89215 9.37502 3.17599 9.37502 3.72115V6.66664C9.37502 6.89675 9.56502 7.08293 9.7951 7.08659C16.5329 7.19375 18.3334 9.93377 18.3334 16.8749C17.1086 14.4254 16.4839 12.9759 9.79594 12.9184C9.56577 12.9164 9.37502 13.1032 9.37502 13.3333V16.2788C9.37502 16.8239 8.72586 17.1078 8.32561 16.7376L1.5377 10.4588C1.27023 10.2114 1.27023 9.7886 1.5377 9.54119Z'
      strokeWidth={1.5}
      strokeLinejoin='round'
      {...props}
    />
  </Svg>
);
