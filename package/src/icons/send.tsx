import React from 'react';
import { I18nManager } from 'react-native';

import Svg, { G, Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const SendRight = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg
      fill={'none'}
      height={height ?? size}
      viewBox={'0 0 20 20'}
      width={width ?? size}
      {...rest}
      testID='send-right'
    >
      <G transform={I18nManager.isRTL ? 'matrix(-1 0 0 1 20 0)' : undefined}>
        <Path
          d='M11.2498 10H6.24982M6.24982 10L3.7881 2.71328C3.74537 2.59349 3.7402 2.4635 3.7733 2.34069C3.80639 2.21788 3.87616 2.10808 3.9733 2.02597C4.07044 1.94386 4.19032 1.89335 4.31693 1.88117C4.44353 1.86899 4.57084 1.89573 4.68185 1.95781L17.8069 9.4461C17.9045 9.50015 17.986 9.57937 18.0427 9.67555C18.0994 9.77172 18.1293 9.88133 18.1293 9.99297C18.1293 10.1046 18.0994 10.2142 18.0427 10.3104C17.986 10.4066 17.9045 10.4858 17.8069 10.5398L4.68185 18.0469C4.57051 18.1096 4.4426 18.1367 4.31537 18.1245C4.18815 18.1123 4.06772 18.0614 3.97032 17.9787C3.87292 17.8959 3.80323 17.7853 3.77065 17.6617C3.73807 17.5381 3.74416 17.4075 3.7881 17.2875L6.24982 10Z'
          fill='none'
          stroke={color}
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
        />
      </G>
    </Svg>
  );
};
