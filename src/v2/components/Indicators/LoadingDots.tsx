import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { LoadingDot } from './LoadingDot';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

type Props = {
  diameter?: number;
  duration?: number;
  numberOfDots?: number;
  spacing?: number;
  style?: StyleProp<ViewStyle>;
};

export const LoadingDots: React.FC<Props> = (props) => {
  const {
    diameter = 4,
    duration = 1500,
    numberOfDots = 3,
    spacing: spacingProp,
    style,
  } = props;

  const {
    theme: {
      loadingDots: { container, spacing },
    },
  } = useTheme();

  const halfSpacing = spacingProp ? spacingProp / 2 : spacing / 2;
  const offsetLength = duration / numberOfDots;

  return (
    <View style={[{ flexDirection: 'row' }, container, style]}>
      {Array.from(Array(numberOfDots)).map((_item, index) => (
        <LoadingDot
          diameter={diameter}
          duration={duration}
          key={index}
          offset={duration - offsetLength * (index + 1)}
          style={
            index === 0
              ? { marginRight: halfSpacing }
              : index === numberOfDots - 1
              ? { marginLeft: halfSpacing }
              : { marginHorizontal: halfSpacing }
          }
        />
      ))}
    </View>
  );
};
