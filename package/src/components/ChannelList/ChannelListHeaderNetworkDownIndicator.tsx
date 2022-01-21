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
      colors: { grey_dark, white },
    },
  } = useTheme('ChannelListHeaderNetworkDownIndicator');
  const { t } = useTranslationContext('ChannelListHeaderNetworkDownIndicator');

  return (
    <View
      style={[styles.container, { backgroundColor: `${grey_dark}E6` }, container]}
      testID='network-down-indicator'
    >
      <Text style={[styles.errorText, { color: white }, errorText]}>{t('Reconnecting...')}</Text>
    </View>
  );
};

ChannelListHeaderNetworkDownIndicator.displayName =
  'ChannelListHeaderNetworkDownIndicator{channelListHeaderErrorIndicator}';
