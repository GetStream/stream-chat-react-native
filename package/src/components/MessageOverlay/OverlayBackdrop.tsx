import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type OverlayBackdropProps = {
  style?: StyleProp<ViewStyle>;
};

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
});

export const OverlayBackdrop = (props: OverlayBackdropProps): JSX.Element => {
  const { style = {} } = props;
  return <View style={[style, styles.backdrop]} />;
};
