import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ChatScreenHeader } from '../components/ChatScreenHeader';

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

export const ThreadListScreen: React.FC = () => {


  return (
    <View
      style={[
        styles.container,
      ]}
    >
      <ChatScreenHeader />
    </View>
  );
};
