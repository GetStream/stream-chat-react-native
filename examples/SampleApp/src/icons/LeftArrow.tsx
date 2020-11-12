import React from 'react';
import { IconProps } from '../utils/base';
import Svg, { G, Path } from 'react-native-svg';
import { useTheme } from '@react-navigation/native';
export const LeftArrow: React.FC<IconProps> = ({ active, height, width }) => {
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
          d='M15.694 18.6943C16.102 18.2867 16.102 17.6259 15.694 17.2184L10.4699 12L15.694 6.78165C16.102 6.37408 16.102 5.71326 15.694 5.30568C15.2859 4.89811 14.6244 4.8981 14.2164 5.30568L8.30602 11.2096C8.08861 11.4267 7.98704 11.7158 8.00132 12.0002C7.98713 12.2844 8.0887 12.5733 8.30603 12.7904L14.2164 18.6943C14.6244 19.1019 15.2859 19.1019 15.694 18.6943Z'
          fill={colors.text}
          fillRule='evenodd'
        />
      </G>
    </Svg>
  );
};
