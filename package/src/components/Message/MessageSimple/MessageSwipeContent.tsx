import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { CurveLineLeftUpReply } from '../../../icons';

export const MessageSwipeContent = () => {
  const {
    theme: {
      semantics,
      messageSimple: {
        swipeLeftContent: { container },
      },
    },
  } = useTheme();
  return (
    <View style={[styles.container, container]}>
      <CurveLineLeftUpReply pathFill={semantics.textSecondary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingRight: 16,
  },
});
