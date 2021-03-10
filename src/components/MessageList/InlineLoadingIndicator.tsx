import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    padding: 10,
    width: '100%',
  },
});

export type InlineLoadingIndicatorProps = {
  loadingMore: boolean;
};

export const InlineLoadingIndicator: React.FC<InlineLoadingIndicatorProps> = ({
  loadingMore,
}) => {
  const { theme } = useTheme();

  const {
    colors: { accent_blue },
  } = theme;

  if (!loadingMore) {
    return null;
  }

  return (
    <View style={styles.activityIndicatorContainer}>
      <ActivityIndicator color={accent_blue} size='small' />
    </View>
  );
};
