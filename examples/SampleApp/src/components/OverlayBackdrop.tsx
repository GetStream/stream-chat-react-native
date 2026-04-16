import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from 'stream-chat-react-native';
import { useLegacyColors } from '../theme/useLegacyColors';

type OverlayBackdropProps = {
  style?: StyleProp<ViewStyle>;
};

export const OverlayBackdrop = (props: OverlayBackdropProps): React.ReactNode => {
  const { style = {} } = props;
  useTheme();
  const { overlay } = useLegacyColors();
  return <View style={[{ backgroundColor: overlay }, style]} />;
};
