import React from 'react';

import { StyleSheet, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from 'stream-chat-react-native';

import { ChatScreenHeader } from '../components/ChatScreenHeader';

import { RemindersList } from '../components/Reminders/RemindersList';
import { useLegacyColors } from '../theme/useLegacyColors';
import { BottomTabNavigatorParamList } from '../types';

export type RemindersScreenProps = {
  navigation: NativeStackNavigationProp<BottomTabNavigatorParamList, 'RemindersScreen'>;
};

export const RemindersScreen: React.FC<RemindersScreenProps> = () => {
  useTheme();
  const { white_snow } = useLegacyColors();

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
      <SafeAreaView edges={['left', 'right']} style={styles.flex}>
        <RemindersList />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
