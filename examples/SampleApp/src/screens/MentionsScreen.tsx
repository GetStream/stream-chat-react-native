import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'stream-chat-react-native/v2';

import { ChatScreenHeader } from '../components/ChatScreenHeader';
import { MessageSearchList } from '../components/MessageSearch/MessageSearchList';
import { usePaginatedSearchedMessages } from '../hooks/usePaginatedSearchedMessages';
import { BottomTabNavigatorParamList } from '../types';

import type { StackNavigationProp } from '@react-navigation/stack';

export type MentionsScreenProps = {
  navigation: StackNavigationProp<
    BottomTabNavigatorParamList,
    'MentionsScreen'
  >;
};

export const MentionsScreen: React.FC<MentionsScreenProps> = () => {
  const {
    theme: {
      colors: { border, white_snow },
    },
  } = useTheme();
  const {
    loadMore,
    messages,
    refreshing,
    refreshList,
  } = usePaginatedSearchedMessages('Unsatiable');

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: white_snow,
          },
        ]}
      >
        <ChatScreenHeader />
        <View
          style={{
            backgroundColor: white_snow,
            borderColor: border,
            flexGrow: 1,
            flexShrink: 1,
          }}
        >
          <MessageSearchList
            loadMore={loadMore}
            messages={messages}
            refreshing={refreshing}
            refreshList={refreshList}
          />
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
  },
  listContainer: {
    flexGrow: 1,
    flexShrink: 1,
  },
});
