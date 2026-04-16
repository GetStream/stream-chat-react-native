import React, { RefObject, useMemo, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'stream-chat-react-native';
import { MessageResponse } from 'stream-chat';

import { ChatScreenHeader } from '../components/ChatScreenHeader';
import { MessageSearchList } from '../components/MessageSearch/MessageSearchList';
import { usePaginatedSearchedMessages } from '../hooks/usePaginatedSearchedMessages';
import { useScrollToTop } from '@react-navigation/native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { BottomTabNavigatorParamList } from '../types';
import { useAppContext } from '../context/AppContext';
import { AtMentions } from '../icons/AtMentions';
import { useLegacyColors } from '../theme/useLegacyColors';

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
  useTheme();
  const { grey, grey_gainsboro } = useLegacyColors();

  return (
    <View style={styles.emptyIndicatorContainer}>
      <AtMentions height={112} pathFill={grey_gainsboro} width={112} />
      <Text style={[styles.emptyIndicatorText, { color: grey }]}>No mentions exist yet...</Text>
    </View>
  );
};

export type MentionsScreenProps = {
  navigation: NativeStackNavigationProp<BottomTabNavigatorParamList, 'MentionsScreen'>;
};

export const MentionsScreen: React.FC<MentionsScreenProps> = () => {
  useTheme();
  const { white_snow } = useLegacyColors();
  const { chatClient } = useAppContext();
  const messageFilters = useMemo(
    () => ({
      'mentioned_users.id': {
        $contains: chatClient?.user?.id || '',
      },
    }),
    [chatClient],
  );

  const scrollRef = useRef<FlatList<MessageResponse> | null>(null);

  useScrollToTop(scrollRef as RefObject<FlatList<MessageResponse>>);

  const { loading, loadMore, messages, refreshing, refreshList } =
    usePaginatedSearchedMessages(messageFilters);

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
      <MessageSearchList
        EmptySearchIndicator={EmptyMentionsSearchIndicator}
        loading={loading}
        loadMore={loadMore}
        messages={messages}
        ref={scrollRef}
        refreshing={refreshing}
        refreshList={refreshList}
      />
    </View>
  );
};
