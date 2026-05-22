import React from 'react';
import { I18nManager } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const ArrowLeft = ({ height, size, style, width, ...rest }: IconProps) => (
  <Svg
    fill='none'
    height={height ?? size}
    style={[style, { transform: [{ rotate: I18nManager.isRTL ? '90deg' : '-90deg' }] }]}
    viewBox='0 0 20 20'
    width={width ?? size}
  >
    <Path
      d='M10 16.875V3.125M10 3.125L4.375 8.75M10 3.125L15.625 8.75'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      {...rest}
    />
  </Svg>
);
