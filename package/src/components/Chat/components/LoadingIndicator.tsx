import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export const LoadingIndicator = () => (
  <View style={styles.container}>
    <ActivityIndicator size='large' />
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
