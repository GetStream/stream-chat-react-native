import React from 'react';
import { I18nManager } from 'react-native';

import Svg, { G, Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Search = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg
      fill='none'
      height={height ?? size}
      viewBox='0 0 20 20'
      width={width ?? size}
      {...rest}
      testID={'search-icon'}
    >
      <G transform={I18nManager.isRTL ? 'matrix(-1 0 0 1 20 0)' : undefined}>
        <Path
          d='M13.1695 13.1695L17.5 17.5M15 8.75C15 12.2018 12.2018 15 8.75 15C5.29822 15 2.5 12.2018 2.5 8.75C2.5 5.29822 5.29822 2.5 8.75 2.5C12.2018 2.5 15 5.29822 15 8.75Z'
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
