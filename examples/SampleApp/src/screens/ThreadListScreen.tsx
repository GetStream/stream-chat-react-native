import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme, ThreadList } from 'stream-chat-react-native';

import { ChatScreenHeader } from '../components/ChatScreenHeader';
import type { StackNavigationProp } from '@react-navigation/stack';

import type { BottomTabNavigatorParamList } from '../types';
import { useNavigation, useIsFocused } from '@react-navigation/native';

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

export type ThreadsScreenProps = {
  navigation: StackNavigationProp<BottomTabNavigatorParamList, 'ThreadsScreen'>;
};

export const ThreadListScreen: React.FC<ThreadsScreenProps> = () => {
  const {
    theme: {
      colors: { white_snow },
    },
  } = useTheme();
  const navigation = useNavigation();
  const isFocused = useIsFocused();

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
      <ThreadList
        isFocused={isFocused}
        onThreadSelect={(thread, channel) => {
          navigation.navigate('ThreadScreen', {
            thread,
            channel,
          });
        }}
      />
    </View>
  );
};
