import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Spinner } from '../Spinner/Spinner';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

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
    <View style={[styles.container, container]}>
      <Spinner />
    </View>
  );
};

ChannelListFooterLoadingIndicator.displayName =
  'ChannelListFooterLoadingIndicator{channelListFooterLoadingIndicator}';
