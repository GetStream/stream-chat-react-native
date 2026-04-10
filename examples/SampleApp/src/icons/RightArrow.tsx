import React from 'react';
import { I18nManager } from 'react-native';
import { G, Path, Svg } from 'react-native-svg';

import { IconProps } from '../utils/base';

export const RightArrow = ({
  fill,
  height,
  pathFill,
  scale,
  stroke,
  width,
  ...rest
}: IconProps) => {
  const color = pathFill ?? fill ?? stroke ?? 'black';
  const size = scale ? 20 * scale : undefined;

  return (
    <Svg fill='none' height={height ?? size} viewBox='0 0 20 20' width={width ?? size} {...rest}>
      <G transform={I18nManager.isRTL ? 'matrix(-1 0 0 1 20 0)' : undefined}>
        <G transform='matrix(-1 0 0 1 20 0)'>
          <Path
            d='M16.875 10H3.125M3.125 10L8.75 4.375M3.125 10L8.75 15.625'
            stroke={color}
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
          />
        </G>
      </G>
    </Svg>
  );
};
