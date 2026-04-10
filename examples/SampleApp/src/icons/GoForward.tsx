import React from 'react';
import { I18nManager } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import { IconProps } from '../utils/base';

export const GoForward: React.FC<IconProps> = ({ height = 20, width = 20, ...rest }) => {
  return (
    <Svg fill='none' height={height} viewBox='0 0 20 20' width={width}>
      <G transform={I18nManager.isRTL ? 'matrix(-1 0 0 1 20 0)' : undefined}>
        <Path
          d='M7.91675 15.2096L13.1251 10.0013L7.91675 4.79297'
          strokeWidth={1.5}
          strokeLinejoin='round'
          strokeLinecap='round'
          {...rest}
        />
      </G>
    </Svg>
  );
};
