import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Sound = ({ fill, height, pathFill, size, stroke, width, ...props }: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg viewBox='0 0 20 20' fill='none' height={height ?? size} width={width ?? size} {...props}>
      <Path
        d='M15.625 8.125V11.875M18.125 6.875V13.125M6.875 13.125H3.125C2.95924 13.125 2.80027 13.0592 2.68306 12.9419C2.56585 12.8247 2.5 12.6658 2.5 12.5V7.5C2.5 7.33424 2.56585 7.17527 2.68306 7.05806C2.80027 6.94085 2.95924 6.875 3.125 6.875H6.875L12.5 2.5V17.5L6.875 13.125Z'
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
};
