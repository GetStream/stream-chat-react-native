import React from 'react';
import Svg, {G, Path} from 'react-native-svg';
import {useTheme} from 'stream-chat-react-native';

import {IconProps} from '../utils/base';

export const Picture: React.FC<IconProps> = ({
  fill,
  height = 24,
  scale = 1,
  width = 24,
}) => {
  const {
    theme: {
      colors: {black},
    },
  } = useTheme();

  return (
    <Svg fill="none" height={height * scale} width={width * scale}>
      <G
        clipRule="evenodd"
        fill={fill || black}
        fillRule="evenodd"
        scale={scale}>
        <Path d="M2 8a3 3 0 013-3h14a3 3 0 013 3v8a3 3 0 01-3 3H5a3 3 0 01-3-3V8zm3-1a1 1 0 00-1 1v8a1 1 0 001 1h14a1 1 0 001-1V8a1 1 0 00-1-1H5z" />
        <Path d="M15.99 9a1 1 0 01.778.36l5 6a1 1 0 11-1.536 1.28l-4.216-5.059-3.235 4.044a1 1 0 01-1.381.175l-3.306-2.48-3.387 3.387a1 1 0 01-1.414-1.414l4-4A1 1 0 018.6 11.2l3.225 2.418 3.394-4.243A1 1 0 0115.99 9z" />
      </G>
    </Svg>
  );
};
