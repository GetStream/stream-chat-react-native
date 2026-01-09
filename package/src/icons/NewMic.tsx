import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const NewMic = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 20 20'} width={width} {...rest}>
    <Path
      d='M10.0007 15.8334C12.5636 15.8334 14.7662 14.2908 15.7307 12.0834M10.0007 15.8334C7.4378 15.8334 5.23519 14.2908 4.27075 12.0834M10.0007 15.8334V17.7084M10.0007 13.1251C8.04469 13.1251 6.45903 11.5394 6.45903 9.58341V5.83341C6.45903 3.87741 8.04469 2.29175 10.0007 2.29175C11.9567 2.29175 13.5423 3.87741 13.5423 5.83341V9.58341C13.5423 11.5394 11.9567 13.1251 10.0007 13.1251Z'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
