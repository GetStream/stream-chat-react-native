import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Reload = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 20 20'} width={width} {...rest}>
    <Path
      d='M16.0515 3.125V5.83333C16.0515 6.17851 15.7718 6.45833 15.4265 6.45833H12.7182M3.95833 16.875V14.1667C3.95833 13.8215 4.23816 13.5417 4.58333 13.5417H7.29167M3.17819 10.8593C3.14308 10.5778 3.125 10.291 3.125 10C3.125 6.20304 6.20304 3.125 10 3.125C12.2305 3.125 14.2592 4.18719 15.5268 5.83333M16.8218 9.14067C16.8569 9.42217 16.875 9.709 16.875 10C16.875 13.7969 13.7969 16.875 10 16.875C7.76952 16.875 5.74072 15.8128 4.4732 14.1667'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
