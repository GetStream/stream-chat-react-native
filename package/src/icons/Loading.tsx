import React from 'react';
import { Path, StopProps, Svg } from 'react-native-svg';

import { IconProps } from './utils/base';

type LoadingProps = IconProps &
  Partial<Pick<StopProps, 'stopOpacity'>> & {
    startColor?: StopProps['stopColor'];
    stopColor?: StopProps['stopColor'];
  };

export const Loading = (props: LoadingProps) => {
  const {
    height = 16,
    startColor = '#0169F6',
    stopColor = '#006CFF',
    stopOpacity = 0.3,
    viewBox = '0 0 20 20',
    width = 16,
  } = props;
  return (
    <Svg height={height} viewBox={viewBox} width={width} {...props}>
      <Path
        d='M17.5 10C17.5 14.1422 14.1422 17.5 10 17.5C5.85787 17.5 2.5 14.1422 2.5 10C2.5 5.85787 5.85787 2.5 10 2.5C14.1422 2.5 17.5 5.85787 17.5 10Z'
        stroke={startColor}
        strokeOpacity={stopOpacity}
        strokeWidth={2}
      />
      <Path
        d='M17.4544 10.8334C17.0701 14.3097 14.3098 17.07 10.8335 17.4543'
        stroke={stopColor}
        strokeWidth={2}
        strokeLinecap='round'
      />
    </Svg>
  );
};
