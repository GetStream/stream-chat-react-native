import React, { RefObject, useMemo, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { ChatScreenHeader } from '../components/ChatScreenHeader';
import { MessageSearchList } from '../components/MessageSearch/MessageSearchList';
import { usePaginatedSearchedMessages } from '../hooks/usePaginatedSearchedMessages';

import type { BottomTabNavigatorParamList } from '../types';
import { useAppContext } from '../context/AppContext';

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

const EmptyMentionsSearchIndicator = () => {

  return (
    <View style={styles.emptyIndicatorContainer}>
      <Text style={[styles.emptyIndicatorText]}>No mentions exist yet...</Text>
    </View>
  );
};

export const MentionsScreen: React.FC = () => {

  const { chatClient } = useAppContext();
  const messageFilters = useMemo(
    () => ({
      'mentioned_users.id': {
        $contains: chatClient?.user?.id || '',
      },
    }),
    [chatClient],
  );


  const { loading, loadMore, messages, refreshing, refreshList } =
    usePaginatedSearchedMessages(messageFilters);

  return null;
};
