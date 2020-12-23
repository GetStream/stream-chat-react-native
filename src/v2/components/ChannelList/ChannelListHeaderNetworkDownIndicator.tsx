import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    width: '100%',
  },
  errorText: {
    fontSize: 14,
  },
});

export const ChannelListHeaderNetworkDownIndicator: React.FC = () => {
  const {
    theme: {
      channelListHeaderErrorIndicator: { container, errorText },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  return (
    <View style={[styles.container, container]}>
      <Text style={[styles.errorText, errorText]}>{t('Reconnecting...')}</Text>
    </View>
  );
};

ChannelListHeaderNetworkDownIndicator.displayName =
  'ChannelListHeaderNetworkDownIndicator{channelListHeaderErrorIndicator}';
