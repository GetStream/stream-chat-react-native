import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useThreadContext } from '../../contexts/threadContext/ThreadContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { useStateStore } from '../../hooks/useStateStore';
import { primitives } from '../../theme';

const lastQueryErrorSelector = (state: { lastQueryError?: Error }) => ({
  lastQueryError: state.lastQueryError,
});

export const NetworkDownIndicator = () => {
  const { channel } = useChannelContext();
  const { threadInstance } = useThreadContext();
  const { isOnline } = useChatContext();
  const styles = useStyles();
  const { t } = useTranslationContext();

  const { lastQueryError } =
    useStateStore((threadInstance ?? channel)?.messagePaginator?.state, lastQueryErrorSelector) ??
    {};

  const indicatorText = useMemo(() => {
    if (!isOnline) {
      return t('common.reconnecting.text', 'Reconnecting...');
    } else if (lastQueryError) {
      return t('indicators.loading.messages.error', 'Error loading messages for this channel...');
    }
    return '';
  }, [lastQueryError, isOnline, t]);

  if (!indicatorText) {
    return null;
  }

  return (
    <View style={styles.container} testID='error-notification'>
      <Text style={styles.errorText}>{indicatorText}</Text>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: {
      messageList: { errorNotification, errorNotificationText },
      semantics,
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        left: 0,
        paddingVertical: primitives.spacingXs,
        paddingHorizontal: primitives.spacingSm,
        position: 'absolute',
        right: 0,
        top: 0,
        justifyContent: 'center',
        backgroundColor: semantics.backgroundCoreSurfaceDefault,
        ...errorNotification,
      },
      errorText: {
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
        color: semantics.chatTextSystem,
        ...errorNotificationText,
      },
    });
  }, [errorNotification, errorNotificationText, semantics]);
};
