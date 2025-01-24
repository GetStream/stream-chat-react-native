import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { CurveLineLeftUp } from '../../../icons';

export const MessageSwipeContent = () => {
  const {
    theme: {
      colors: { grey },
      messageSimple: {
        swipeLeftContent: { container },
      },
    },
  } = useTheme();
  return (
    <View style={[styles.container, container]}>
      <CurveLineLeftUp pathFill={grey} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingRight: 16,
  },
});
