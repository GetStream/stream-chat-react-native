import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, ThreadList } from 'stream-chat-react-native';

import { ChatScreenHeader } from '../components/ChatScreenHeader';
import type { StackNavigationProp } from '@react-navigation/stack';

import type { BottomTabNavigatorParamList } from '../types';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyIndicatorContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyIndicatorText: {
    fontSize: 14,
    paddingTop: 28,
  },
});

const EmptyThreadsIndicator = () => {
  return (
    <View style={styles.emptyIndicatorContainer}>
      <Text style={styles.emptyIndicatorText}>No threads found.</Text>
    </View>
  );
};

export type ThreadsScreenProps = {
  navigation: StackNavigationProp<BottomTabNavigatorParamList, 'MentionsScreen'>;
};

export const ThreadListScreen: React.FC<ThreadsScreenProps> = () => {
  const {
    theme: {
      colors: { white_snow },
    },
  } = useTheme();
  // const { chatClient } = useAppContext();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: white_snow,
        },
      ]}
    >
      <ChatScreenHeader />
      <ThreadList />
    </View>
  );
};
