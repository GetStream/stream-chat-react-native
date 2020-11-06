import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { NavigationParamsList } from '../types';
import { ScreenHeader } from '../components/ScreenHeader';

export type MentionsScreenProps = {
  navigation: StackNavigationProp<NavigationParamsList, 'ChannelList'>;
};

export const MentionsScreen: React.FC<MentionsScreenProps> = () => {
  const { colors } = useTheme();
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
        <ScreenHeader />
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
