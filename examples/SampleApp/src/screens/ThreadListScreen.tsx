import React, { useMemo, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { AtMentions, useTheme } from 'stream-chat-react-native';
import { MessageResponse } from 'stream-chat';

import { ChatScreenHeader } from '../components/ChatScreenHeader';
import { MessageSearchList } from '../components/MessageSearch/MessageSearchList';
import { usePaginatedSearchedMessages } from '../hooks/usePaginatedSearchedMessages';
import { useScrollToTop } from '@react-navigation/native';

import type { StackNavigationProp } from '@react-navigation/stack';

import type { BottomTabNavigatorParamList } from '../types';
import { useAppContext } from '../context/AppContext';
import type { StreamChatGenerics } from '../types';

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
      <>
        <Text>Thread List goes here :^)</Text>
      </>
    </View>
  );
};
