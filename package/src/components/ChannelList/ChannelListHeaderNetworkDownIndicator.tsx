import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { primitives } from '../../theme';

export const ChannelListHeaderNetworkDownIndicator = () => {
  const styles = useStyles();
  const { t } = useTranslationContext();

  return (
    <View style={styles.container} testID='network-down-indicator'>
      <Text style={styles.errorText}>{t('Reconnecting...')}</Text>
    </View>
  );
};

ChannelListHeaderNetworkDownIndicator.displayName =
  'ChannelListHeaderNetworkDownIndicator{channelListHeaderErrorIndicator}';

const useStyles = () => {
  const {
    theme: {
      channelListHeaderErrorIndicator: { container, errorText },
      semantics,
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        backgroundColor: semantics.backgroundCoreSurfaceDefault,
        paddingVertical: primitives.spacingXs,
        paddingHorizontal: primitives.spacingSm,
        ...container,
      },
      errorText: {
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
        color: semantics.chatTextSystem,
        ...errorText,
      },
    });
  }, [container, errorText, semantics]);
};
