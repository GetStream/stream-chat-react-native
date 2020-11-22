import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { AppTheme, BottomTabNavigatorParamList } from '../types';
import { ChatScreenHeader } from '../components/ChatScreenHeader';

export type MentionsScreenProps = {
  navigation: StackNavigationProp<
    BottomTabNavigatorParamList,
    'MentionsScreen'
  >;
};

export const MentionsScreen: React.FC<MentionsScreenProps> = () => {
  const { colors } = useTheme() as AppTheme;
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
        />
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
