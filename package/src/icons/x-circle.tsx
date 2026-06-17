import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const XCircle = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg width={width ?? size} height={height ?? size} viewBox='0 0 20 20' fill='none' {...rest}>
      <Path
        d='M12.5 7.5L7.5 12.5M7.5 7.5L12.5 12.5M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z'
        stroke={color}
        strokeWidth={2}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
};
