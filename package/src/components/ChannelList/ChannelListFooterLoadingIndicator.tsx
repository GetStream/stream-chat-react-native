import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Spinner } from '../Spinner/Spinner';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});

export const ChannelListFooterLoadingIndicator: React.FC = () => {
  const {
    theme: {
      channelListFooterLoadingIndicator: { container },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]} testID='channel-list-footer-loading-indicator'>
      <Spinner height={20} width={20} />
    </View>
  );
};

ChannelListFooterLoadingIndicator.displayName =
  'ChannelListFooterLoadingIndicator{channelListFooterLoadingIndicator}';
