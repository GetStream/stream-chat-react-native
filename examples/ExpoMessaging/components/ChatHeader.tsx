import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LogoutButton } from './LogoutButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStreamChatTheme } from '@/hooks/useStreamChatTheme';

export const ChatHeader = () => {
  const theme = useStreamChatTheme();
  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: theme.colors?.white_snow }]}
    >
      <View style={styles.leftContainer}>
        <LogoutButton />
      </View>
      <View style={styles.centerContainer}>
        <Text style={[styles.title, { color: theme.colors?.black }]}>Chats</Text>
      </View>
      <View style={styles.rightContainer} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  leftContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centerContainer: {},
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rightContainer: {
    flex: 1,
  },
});
