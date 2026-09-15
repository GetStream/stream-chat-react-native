import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { primitives } from '../../theme';
import { useNetworkConnectionState } from '../Chat/hooks/useNetworkConnectionState';
import { useWSConnectionState } from '../Chat/hooks/useWSConnectionState';

export const NetworkDownIndicator = () => {
  const isNetworkOnline = useNetworkConnectionState()?.isOnline;
  const isWSOnline = useWSConnectionState()?.isOnline;
  const styles = useStyles();
  const { t } = useTranslationContext();

  const hasNoNetwork = isNetworkOnline === false;

  if (!hasNoNetwork && isWSOnline) {
    return null;
  }

  return (
    <View style={styles.container} testID='error-notification'>
      <Text style={styles.errorText}>
        {hasNoNetwork
          ? t('common.waitingForNetwork.text', 'Waiting for network...')
          : t('common.reconnecting.text', 'Reconnecting...')}
      </Text>
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
