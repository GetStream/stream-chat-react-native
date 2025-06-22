import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

type OverlayBackdropProps = {
  style?: StyleProp<ViewStyle>;
};

export const OverlayBackdrop = (props: OverlayBackdropProps): React.ReactNode => {
  const { style = {} } = props;
  const grey = '#808080';
  return <View style={[{ backgroundColor: grey }, style]} />;
};
