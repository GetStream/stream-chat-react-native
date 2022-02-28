import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

type OverlayBackdropProps = {
  style?: StyleProp<ViewStyle>;
};

export const OverlayBackdrop = (props: OverlayBackdropProps): JSX.Element => {
  const { style = {} } = props;
  const {
    theme: {
      colors: { overlay },
    },
  } = useTheme();
  return <View style={[{ backgroundColor: overlay }, style]} />;
};
