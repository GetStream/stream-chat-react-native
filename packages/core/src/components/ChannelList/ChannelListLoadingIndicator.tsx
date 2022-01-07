import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useChannelsContext } from '../../contexts/channelsContext/ChannelsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export const ChannelListLoadingIndicator: React.FC = () => {
  const {
    theme: {
      channelListLoadingIndicator: { container },
      colors: { white_snow },
    },
  } = useTheme();
  const { numberOfSkeletons, Skeleton } = useChannelsContext();

  return (
    <View
      style={[styles.container, { backgroundColor: white_snow }, container]}
      testID='channel-list-loading-indicator'
    >
      {Array.from(Array(numberOfSkeletons)).map((_, index) => (
        <Skeleton key={`skeleton_${index}`} />
      ))}
    </View>
  );
};
