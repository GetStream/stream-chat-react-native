import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const PeopleIcon = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={`0 0 20 20`} width={width} {...rest}>
    <Path
      d='M13.125 5.41667C13.125 7.14256 11.7259 8.54167 10 8.54167C8.27411 8.54167 6.875 7.14256 6.875 5.41667C6.875 3.69078 8.27411 2.29167 10 2.29167C11.7259 2.29167 13.125 3.69078 13.125 5.41667Z'
      strokeLinejoin='round'
      strokeWidth={1.5}
      {...rest}
    />
    <Path
      d='M10.0009 11.0417C7.17497 11.0417 5.03092 12.7203 4.153 15.0941C3.81233 16.0152 4.59953 16.875 5.58163 16.875H14.4202C15.4023 16.875 16.1895 16.0152 15.8488 15.0941C14.9709 12.7203 12.8269 11.0417 10.0009 11.0417Z'
      strokeLinejoin='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
