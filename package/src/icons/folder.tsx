import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Folder = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg
      fill={'none'}
      height={height ?? size}
      viewBox={'0 0 17 14'}
      width={width ?? size}
      {...rest}
    >
      <Path
        d='M15.75 3.25V12.0695C15.75 12.2169 15.6915 12.3581 15.5873 12.4623C15.4831 12.5665 15.3419 12.625 15.1945 12.625H1.375C1.20924 12.625 1.05027 12.5592 0.933058 12.4419C0.815848 12.3247 0.75 12.1658 0.75 12V1.375C0.75 1.20924 0.815848 1.05027 0.933058 0.933058C1.05027 0.815848 1.20924 0.75 1.375 0.75H5.54141C5.67664 0.75 5.80822 0.793861 5.91641 0.875L8.25 2.625H15.125C15.2908 2.625 15.4497 2.69085 15.5669 2.80806C15.6842 2.92527 15.75 3.08424 15.75 3.25Z'
        fill='none'
        stroke={color}
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
      />
    </Svg>
  );
};
