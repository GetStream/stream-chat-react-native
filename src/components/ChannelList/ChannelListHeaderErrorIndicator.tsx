import React from 'react';
import { GestureResponderEvent, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    fontWeight: 'bold',
    padding: 3,
  },
});

export type HeaderErrorProps = {
  onPress?: (event: GestureResponderEvent) => void;
};

export const ChannelListHeaderErrorIndicator: React.FC<HeaderErrorProps> = ({
  onPress = () => null,
}) => {
  const {
    theme: {
      channelListHeaderErrorIndicator: { container, errorText },
      colors: { accent_red, grey },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, { backgroundColor: `${grey}E6` }, container]}
    >
      <Text
        style={[styles.errorText, { color: accent_red }, errorText]}
        testID='channel-loading-error'
      >
        {t('Error while loading, please reload/refresh')}
      </Text>
    </TouchableOpacity>
  );
};

ChannelListHeaderErrorIndicator.displayName =
  'ChannelListHeaderErrorIndicator{channelListHeaderErrorIndicator}';
