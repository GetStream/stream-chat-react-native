import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const NewPin = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 12 12'} width={width} {...rest}>
    <Path
      d='M4.1875 7.81274L6.1046 9.72984C6.6838 10.309 7.6755 9.98434 7.80005 9.17479L8.1698 6.77149C8.22 6.44529 8.4279 6.16484 8.72545 6.02199L10.1027 5.36094C10.7242 5.06264 10.8645 4.23975 10.3771 3.75231L8.24795 1.62316C7.7605 1.13571 6.9376 1.27606 6.6393 1.89753L5.9782 3.27478C5.8354 3.57233 5.55495 3.78024 5.22875 3.83042L2.82546 4.20016C2.01588 4.32471 1.69122 5.31644 2.27041 5.89564L4.1875 7.81274ZM4.1875 7.81274L4.19117 7.80904M4.1875 7.81274L1.875 10.1252'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.2}
      {...rest}
    />
  </Svg>
);
