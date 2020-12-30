import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AtMentions, useTheme } from 'stream-chat-react-native/v2';

import { ChatScreenHeader } from '../components/ChatScreenHeader';
import { MessageSearchList } from '../components/MessageSearch/MessageSearchList';
import { usePaginatedSearchedMessages } from '../hooks/usePaginatedSearchedMessages';

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

const EmptyMentionsSearchIndicator = () => {
  const {
    theme: {
      colors: { grey, grey_gainsboro },
    },
  } = useTheme();

  return (
    <View style={styles.emptyIndicatorContainer}>
      <AtMentions height={112} pathFill={grey_gainsboro} width={112} />
      <Text style={[styles.emptyIndicatorText, { color: grey }]}>
        No mentions exist yet...
      </Text>
    </View>
  );
};

export type MentionsScreenProps = {
  navigation: StackNavigationProp<
    BottomTabNavigatorParamList,
    'MentionsScreen'
  >;
};

export const MentionsScreen: React.FC<MentionsScreenProps> = () => {
  const {
    theme: {
      colors: { white_snow },
    },
  } = useTheme();
  const {
    loading,
    loadMore,
    messages,
    refreshing,
    refreshList,
  } = usePaginatedSearchedMessages('Unsatiable');

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
      <View style={styles.container}>
        <MessageSearchList
          EmptySearchIndicator={EmptyMentionsSearchIndicator}
          loading={loading}
          loadMore={loadMore}
          messages={messages}
          refreshing={refreshing}
          refreshList={refreshList}
        />
      </View>
    </View>
  );
};
