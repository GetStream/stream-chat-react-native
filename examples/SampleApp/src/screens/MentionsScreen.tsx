import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { AppTheme, BottomTabNavigatorParamList } from '../types';
import { ChatScreenHeader } from '../components/ChatScreenHeader';
import { usePaginatedSearchedMessages } from '../hooks/usePaginatedSearchedMessages';
import dayjs from 'dayjs';
import { Avatar } from 'stream-chat-react-native/v2';
import { MessageSearchList } from '../components/MessageSearch/MessageSearchList';

export type MentionsScreenProps = {
  navigation: StackNavigationProp<
    BottomTabNavigatorParamList,
    'MentionsScreen'
  >;
};

export const MentionsScreen: React.FC<MentionsScreenProps> = () => {
  const { colors } = useTheme() as AppTheme;
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
            backgroundColor: colors.background,
          },
        ]}
      >
        <ChatScreenHeader />
        <View
          style={{
            backgroundColor: colors.background,
            borderColor: 'black',
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
