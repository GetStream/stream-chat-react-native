import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const NewPhoto = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={`0 0 12 12`} width={width} {...rest}>
    <Path
      d='M2.375 3.375H3.21481C3.54917 3.375 3.8614 3.2079 4.04686 2.9297L4.45313 2.3203C4.6386 2.0421 4.95083 1.875 5.2852 1.875H6.7148C7.04915 1.875 7.3614 2.0421 7.54685 2.3203L7.95315 2.9297C8.1386 3.2079 8.45085 3.375 8.7852 3.375H9.625C10.1773 3.375 10.625 3.82272 10.625 4.375V9.125C10.625 9.6773 10.1773 10.125 9.625 10.125H2.375C1.82271 10.125 1.375 9.6773 1.375 9.125V4.375C1.375 3.82272 1.82271 3.375 2.375 3.375Z'
      strokeLinecap='square'
      strokeLinejoin='round'
      strokeWidth={1.2}
      {...rest}
    />
    <Path
      d='M7.625 6.5C7.625 7.39745 6.89745 8.125 6 8.125C5.10255 8.125 4.375 7.39745 4.375 6.5C4.375 5.60255 5.10255 4.875 6 4.875C6.89745 4.875 7.625 5.60255 7.625 6.5Z'
      strokeLinecap='square'
      strokeLinejoin='round'
      strokeWidth={1.2}
      {...rest}
    />
  </Svg>
);
