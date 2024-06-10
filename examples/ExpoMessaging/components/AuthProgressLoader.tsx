import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const AuthProgressLoader = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
