import React, { useEffect, useState } from 'react';
import { useTheme } from '@react-navigation/native';
import { defaultTheme, Theme } from 'stream-chat-react-native/v2';
import { AppTheme } from '../types';

export const useStreamChatTheme = () => {
  const { colors } = useTheme() as AppTheme;
  const getChatStyle = (): Theme => ({
    ...defaultTheme,
    channelPreview: {
      ...defaultTheme.channelPreview,
      container: {
        backgroundColor: colors.background,
        borderBottomColor: colors.borderLight,
      },
      date: {
        color: colors.text,
      },
      message: {
        color: colors.textLight,
      },
      title: {
        color: colors.text,
      },
    },
  });
  const [chatStyle, setChatStyle] = useState(getChatStyle());

  useEffect(() => {
    setChatStyle(getChatStyle());
  }, [colors]);

  return chatStyle;
};
