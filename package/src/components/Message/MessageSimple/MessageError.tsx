import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Error } from '../../../icons';

export type MessageErrorProps = {
  style?: StyleProp<ViewStyle>;
};

export const MessageError = ({ style }: MessageErrorProps) => {
  const {
    theme: {
      colors: { accent_red },
      messageSimple: {
        content: { errorIcon, errorIconContainer },
      },
    },
  } = useTheme();

  return (
    <View style={[StyleSheet.absoluteFill, style]} testID='message-error'>
      <View style={errorIconContainer}>
        <Error pathFill={accent_red} {...errorIcon} />
      </View>
    </View>
  );
};
