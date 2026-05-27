import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useNavigation, useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, ThreadList } from 'stream-chat-react-native';

import { ChatScreenHeader } from '../components/ChatScreenHeader';

import { useLegacyColors } from '../theme/useLegacyColors';
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

export type ThreadsScreenProps = {
  navigation: NativeStackNavigationProp<BottomTabNavigatorParamList, 'ThreadsScreen'>;
};

export const ThreadListScreen: React.FC<ThreadsScreenProps> = () => {
  useTheme();
  const { white_snow } = useLegacyColors();
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
