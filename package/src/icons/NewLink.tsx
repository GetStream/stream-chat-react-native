import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const NewLink = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={`0 0 12 12`} width={width} {...rest}>
    <Path
      d='M4.87513 2.76186L5.3584 2.27861C6.5632 1.0738 8.5166 1.0738 9.7214 2.27861C10.9262 3.48342 10.9262 5.4368 9.7214 6.6416L9.2371 7.12595M2.76443 4.87257L2.27861 5.3584C1.07379 6.5632 1.0738 8.5166 2.27861 9.7214C3.48342 10.9262 5.4368 10.9262 6.6416 9.7214L7.1239 9.2391M4.75 7.25L7.25 4.75'
      strokeLinejoin='round'
      strokeWidth={1.2}
      {...rest}
    />
  </Svg>
);
