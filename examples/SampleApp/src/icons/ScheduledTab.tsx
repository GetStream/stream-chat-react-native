import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { useLegacyColors } from '../theme/useLegacyColors';
import { IconProps } from '../utils/base';

/** A filled clock while the tab is active, and the SDK's outlined clock otherwise, as in Figma. */
export const ScheduledTab: React.FC<IconProps> = ({ active, height = 24, width = 24 }) => {
  const { black, grey } = useLegacyColors();

  if (!active) {
    return (
      <Svg fill='none' height={height} viewBox='0 0 20 20' width={width}>
        <Path
          d='M10 5.625V10H14.375M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z'
          stroke={grey}
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
        />
      </Svg>
    );
  }

  return (
    <Svg fill='none' height={height} viewBox='0 0 24 24' width={width}>
      <Path
        clipRule='evenodd'
        d='M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm1-15a1 1 0 10-2 0v5a1 1 0 00.293.707l3 3a1 1 0 001.414-1.414L13 11.586V7z'
        fill={black}
        fillRule='evenodd'
      />
    </Svg>
  );
};
