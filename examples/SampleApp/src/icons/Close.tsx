import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from '../utils/base';
import { useLegacyColors } from '../theme/useLegacyColors';

export const Close: React.FC<IconProps> = ({
  fill,
  height = 24,
  pathFill,
  stroke,
  width = 24,
}) => {
  const { black } = useLegacyColors();
  const color = pathFill ?? fill ?? stroke ?? black;

  return (
    <Svg fill='none' height={height} viewBox='0 0 24 24' width={width}>
      <Path
        clipRule='evenodd'
        d='M7.05 7.05a1 1 0 000 1.414L10.586 12 7.05 15.536a1 1 0 101.414 1.414L12 13.414l3.536 3.536a1 1 0 001.414-1.414L13.414 12l3.536-3.536a1 1 0 00-1.414-1.414L12 10.586 8.464 7.05a1 1 0 00-1.414 0z'
        fill={color}
        fillRule='evenodd'
      />
    </Svg>
  );
};
