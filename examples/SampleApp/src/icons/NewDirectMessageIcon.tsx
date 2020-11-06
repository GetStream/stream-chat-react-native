import React from 'react';
import { IconProps } from '../utils/base';
import Svg, { G, Path } from 'react-native-svg';
import { useTheme } from '@react-navigation/native';
export const NewDirectMessageIcon: React.FC<IconProps> = ({
  active,
  color,
  height,
  width,
}) => {
  const { colors } = useTheme();
  return (
    <Svg
      fill='none'
      height={height}
      viewBox={`0 0 ${height} ${width}`}
      width={width}
      xmlns='http://www.w3.org/2000/svg'
    >
      <G opacity={active ? 1 : 0.5}>
        <Path
          clipRule='evenodd'
          d='M21 21H3V16.757L16.435 3.32201C16.8255 2.93163 17.4585 2.93163 17.849 3.32201L20.678 6.15101C21.0684 6.54151 21.0684 7.17451 20.678 7.56501L9.243 19H21V21ZM5 19H6.414L15.728 9.68601L14.314 8.27201L5 17.586V19ZM18.556 6.85801L17.142 8.27201L15.728 6.85801L17.142 5.44401L18.556 6.85801Z'
          fill={color || colors.text}
          fillRule='evenodd'
        />
      </G>
    </Svg>
  );
};
