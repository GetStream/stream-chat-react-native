import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from '../utils/base';
import { useLegacyColors } from '../theme/useLegacyColors';

export const RemindersTab: React.FC<IconProps> = ({ active, height = 24, width = 24 }) => {
  const { black, grey } = useLegacyColors();

  return (
    <Svg fill='none' height={height} viewBox={`0 0 ${height} ${width}`} width={width}>
      <Path d='M12 9a1 1 0 112 0v4a1 1 0 01-1 1H9a1 1 0 110-2h3V9z' fill={active ? black : grey} />
      <Path
        clipRule='evenodd'
        d='M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10zm-2 0a8 8 0 11-16 0 8 8 0 0116 0z'
        fill={active ? black : grey}
        fillRule='evenodd'
      />
    </Svg>
  );
};
