import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Shield = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg width={width ?? size} height={height ?? size} viewBox='0 0 16 16' fill='none' {...rest}>
      <Path
        d='M13.5 7V3.5C13.5 3.36739 13.4473 3.24021 13.3536 3.14645C13.2598 3.05268 13.1326 3 13 3H3C2.86739 3 2.74021 3.05268 2.64645 3.14645C2.55268 3.24021 2.5 3.36739 2.5 3.5V7C2.5 13 8 14.5 8 14.5C8 14.5 13.5 13 13.5 7Z'
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
};
