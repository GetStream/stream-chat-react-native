import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const Delete = ({ fill, height, pathFill, size, stroke, width, ...rest }: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg viewBox='0 0 13 14' fill='none' height={height ?? size} width={width ?? size} {...rest}>
      <Path
        d='M16.875 4.375H3.125M8.125 8.125V13.125M11.875 8.125V13.125M15.625 4.375V16.25C15.625 16.4158 15.5592 16.5747 15.4419 16.6919C15.3247 16.8092 15.1658 16.875 15 16.875H5C4.83424 16.875 4.67527 16.8092 4.55806 16.6919C4.44085 16.5747 4.375 16.4158 4.375 16.25V4.375M13.125 4.375V3.125C13.125 2.79348 12.9933 2.47554 12.7589 2.24112C12.5245 2.0067 12.2065 1.875 11.875 1.875H8.125C7.79348 1.875 7.47554 2.0067 7.24112 2.24112C7.0067 2.47554 6.875 2.79348 6.875 3.125V4.375'
        stroke={color}
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
      />
    </Svg>
  );
};
