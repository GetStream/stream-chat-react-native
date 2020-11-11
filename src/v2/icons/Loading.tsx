import React from 'react';
import { Defs, LinearGradient, Stop, StopProps } from 'react-native-svg';

import { IconProps, RootPath, RootSvg } from './utils/base';

type LoadingProps = IconProps &
  Partial<Pick<StopProps, 'stopOpacity'>> & {
    startColor?: StopProps['stopColor'];
    stopColor?: StopProps['stopColor'];
  };

export const Loading: React.FC<LoadingProps> = (props) => {
  const {
    height = 16,
    startColor = '#0169F6',
    stopColor = '#006CFF',
    stopOpacity = 0.01,
    viewBox = '0 0 16 16',
    width = 16,
  } = props;
  return (
    <RootSvg height={height} viewBox={viewBox} width={width} {...props}>
      <RootPath
        d='M16 8a8 8 0 01-14.657 4.438l2.527-1.685A5 5 0 108 2.933V0a8 8 0 018 8z'
        pathFill='url(#gradient)'
      />
      <Defs>
        <LinearGradient
          gradientUnits='userSpaceOnUse'
          id='gradient'
          x1={1.3429}
          x2={1.3429}
          y1={0}
          y2={height}
        >
          <Stop stopColor={startColor} stopOpacity={stopOpacity} />
          <Stop offset={1} stopColor={stopColor} />
        </LinearGradient>
      </Defs>
    </RootSvg>
  );
};
