import React from 'react';

import { Path, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

export const EyeOpen = ({ height, width, ...rest }: IconProps) => (
  <Svg fill={'none'} height={height} viewBox={'0 0 16 16'} width={width} {...rest}>
    <Path
      d='M8 2.66699C10.5861 2.66701 13.1053 4.21304 14.7876 7.16533C15.0826 7.68299 15.0826 8.31766 14.7876 8.83539C13.1053 11.7877 10.5861 13.3337 8 13.3336C5.41395 13.3336 2.89477 11.7876 1.21246 8.83526C0.917461 8.31759 0.917461 7.68293 1.21246 7.16526C2.89477 4.21297 5.41395 2.66697 8 2.66699ZM5.58335 8.00033C5.58335 6.66564 6.66533 5.58366 8 5.58366C9.33473 5.58366 10.4167 6.66564 10.4167 8.00033C10.4167 9.33499 9.33473 10.417 8 10.417C6.66533 10.417 5.58335 9.33499 5.58335 8.00033Z'
      fillRule='evenodd'
      clipRule='evenodd'
      {...rest}
    />
  </Svg>
);
