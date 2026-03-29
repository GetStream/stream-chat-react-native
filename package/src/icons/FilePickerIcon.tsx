import React from 'react';

import Svg, { Path } from 'react-native-svg';

import { IconProps } from './utils/base';

export const FilePickerIcon = ({
  fill,
  height,
  pathFill,
  size,
  stroke,
  width,
  ...rest
}: IconProps) => {
  const color = stroke ?? pathFill ?? fill ?? 'black';

  return (
    <Svg
      fill='none'
      viewBox='2.25 1.75 15 16.5'
      height={height ?? size}
      width={width ?? size}
      {...rest}
    >
      <Path
        d='M12.4999 6.24998L5.9913 12.8664C5.76258 13.102 5.63576 13.4181 5.63823 13.7465C5.6407 14.0748 5.77227 14.389 6.00451 14.6211C6.23674 14.8533 6.55099 14.9847 6.87934 14.987C7.20769 14.9894 7.52376 14.8624 7.75927 14.6336L15.5179 6.76795C15.9868 6.29905 16.2502 5.6631 16.2502 4.99998C16.2502 4.33686 15.9868 3.70091 15.5179 3.23201C15.049 2.76312 14.413 2.49969 13.7499 2.49969C13.0868 2.49969 12.4508 2.76312 11.9819 3.23201L4.22333 11.0984C3.52953 11.8036 3.14249 12.7544 3.14652 13.7437C3.15054 14.7329 3.54531 15.6805 4.24483 16.38C4.94435 17.0796 5.89195 17.4743 6.88121 17.4784C7.87048 17.4824 8.82126 17.0953 9.52645 16.4015L15.9374 9.99998'
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
  );
};
