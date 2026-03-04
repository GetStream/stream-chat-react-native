import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Share = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={`0 0 20 20`} width={width} {...rest}>
    <Path
      d='M6.45831 5.20703L9.99998 1.45703L13.5416 5.20703M9.99998 2.29036V11.0404M6.45831 8.1237H5.62498C4.7045 8.1237 3.95831 8.86986 3.95831 9.79036V15.207C3.95831 16.1275 4.7045 16.8737 5.62498 16.8737H14.375C15.2955 16.8737 16.0416 16.1275 16.0416 15.207V9.79036C16.0416 8.86986 15.2955 8.1237 14.375 8.1237H13.5416'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...rest}
    />
  </Svg>
);
