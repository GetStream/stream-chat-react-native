import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FAE6E8',
    justifyContent: 'center',
    padding: 3,
    width: '100%',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    fontWeight: 'bold',
    padding: 3,
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
      <Text style={[styles.errorText, errorText]}>
        {t('Connection failure, reconnecting now ...')}
      </Text>
    </View>
  );
};

ChannelListHeaderNetworkDownIndicator.displayName =
  'ChannelListHeaderNetworkDownIndicator{channelListHeaderErrorIndicator}';
