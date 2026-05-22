import React from 'react';
import { I18nManager } from 'react-native';

import Svg, { G, Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const MessageBubbleEmpty = ({ height, size, width, ...props }: IconProps) => (
  <Svg height={height ?? size} width={width ?? size} fill={'none'} viewBox={'0 0 20 20'} {...props}>
    <G transform={I18nManager.isRTL ? 'matrix(-1 0 0 1 20 0)' : undefined}>
      <Path
        d='M6.24431 16.4932C7.81972 17.405 9.67297 17.7127 11.4585 17.359C13.2441 17.0053 14.84 16.0143 15.9489 14.5708C17.0578 13.1273 17.6038 11.3298 17.4852 9.51341C17.3667 7.69704 16.5916 5.98577 15.3045 4.69866C14.0174 3.41156 12.3061 2.63646 10.4897 2.51789C8.67333 2.39932 6.87582 2.94537 5.43231 4.05422C3.9888 5.16308 2.99781 6.75906 2.64412 8.54461C2.29042 10.3302 2.59815 12.1834 3.50993 13.7588L2.53259 16.6768C2.49586 16.7869 2.49053 16.9051 2.5172 17.0181C2.54386 17.131 2.60146 17.2344 2.68355 17.3165C2.76563 17.3985 2.86895 17.4561 2.98194 17.4828C3.09492 17.5095 3.21309 17.5041 3.32321 17.4674L6.24431 16.4932Z'
        strokeLinejoin='round'
        strokeLinecap='round'
        strokeWidth={1.5}
        {...props}
      />
    </G>
  </Svg>
);
