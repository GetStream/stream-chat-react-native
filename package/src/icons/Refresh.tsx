import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Refresh = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg fill='none' height={height ?? size} viewBox='0 0 24 24' width={width ?? size} {...rest}>
      <Path
        d='M13.125 7.49978H16.875M16.875 7.49978V3.74978M16.875 7.49978L14.6656 5.29041C13.3861 4.01095 11.6538 3.2875 9.84437 3.27697C8.03494 3.26644 6.29431 3.96968 5 5.23416M6.875 12.4998H3.125M3.125 12.4998V16.2498M3.125 12.4998L5.33437 14.7092C6.61388 15.9886 8.34621 16.7121 10.1556 16.7226C11.9651 16.7331 13.7057 16.0299 15 14.7654'
        stroke={color}
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
      />
    </Svg>
  );
};
