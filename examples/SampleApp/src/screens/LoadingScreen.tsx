import React from 'react';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});

export const LoadingScreen: React.FC = () => {
  const colorScheme = useColorScheme();

  return (
    <View
      style={[
        styles.container,
      ]}
     />
  );
};
