import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const ArrowUpRight = ({ height = 16, width = 16, ...rest }: IconProps) => {
  return (
    <Svg height={height} viewBox={'0 0 16 16'} width={width} fill={'none'} {...rest}>
      <Path
        d='M12.1667 10.1673V3.83398M12.1667 3.83398H5.83333M12.1667 3.83398L4 12.0007'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        {...rest}
      />
    </Svg>
  );
};
