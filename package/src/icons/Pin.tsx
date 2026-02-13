import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

type Props = IconProps;

export const Pin = (props: Props) => (
  <Svg viewBox='0 0 20 20' fill='none' {...props}>
    <Path
      d='M6.97917 13.0208L10.1743 16.216C11.1397 17.1812 12.7925 16.6401 13.0001 15.2909L13.6163 11.2854C13.7 10.7417 14.0465 10.2743 14.5424 10.0362L16.8378 8.93448C17.8736 8.43731 18.1075 7.06583 17.2952 6.25342L13.7466 2.70484C12.9342 1.89242 11.5627 2.12635 11.0655 3.16213L9.96367 5.45755C9.72567 5.95345 9.25825 6.29997 8.71458 6.38361L4.7091 6.99985C3.3598 7.20743 2.81869 8.86031 3.78401 9.82565L6.97917 13.0208ZM6.97917 13.0208L6.98529 13.0146M6.97917 13.0208L3.125 16.875'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    />
  </Svg>
);
