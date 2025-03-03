import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from 'stream-chat-react-native';

type OverlayBackdropProps = {
  style?: StyleProp<ViewStyle>;
};

export const OverlayBackdrop = (props: OverlayBackdropProps): React.ReactNode => {
  const { style = {} } = props;
  const {
    theme: {
      colors: { overlay },
    },
  } = useTheme();
  return <View style={[{ backgroundColor: overlay }, style]} />;
};
