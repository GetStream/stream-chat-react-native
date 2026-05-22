import React from 'react';
import { I18nManager } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const ArrowUpRight = ({ height, size, width, ...rest }: IconProps) => {
  return (
    <Svg
      height={height ?? size ?? 16}
      viewBox={'0 0 20 20'}
      width={width ?? size ?? 16}
      fill={'none'}
      {...rest}
    >
      <G transform={I18nManager.isRTL ? 'matrix(-1 0 0 1 20 0)' : undefined}>
        <Path
          d='M5 15L15 5M15 5H6.875M15 5V13.125'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          {...rest}
        />
      </G>
    </Svg>
  );
};
