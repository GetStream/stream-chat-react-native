import React from 'react';

import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigatorParamList } from '../types';
import { StyleSheet, View } from 'react-native';
import { ChatScreenHeader } from '../components/ChatScreenHeader';
import { useTheme } from 'stream-chat-react-native';
import { RemindersList } from '../components/Reminders/RemindersList';

export type RemindersScreenProps = {
  navigation: StackNavigationProp<BottomTabNavigatorParamList, 'RemindersScreen'>;
};

export const RemindersScreen: React.FC<RemindersScreenProps> = () => {
  const {
    theme: {
      colors: { white_snow },
    },
  } = useTheme();

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
      <RemindersList />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tab: {
    paddingHorizontal: 12,
    margin: 4,
    justifyContent: 'center',
    borderRadius: 16,
    height: 32,
  },
  tabText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: 'white',
  },
});
