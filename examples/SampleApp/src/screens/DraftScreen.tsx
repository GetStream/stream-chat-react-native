import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigatorParamList } from '../types';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'stream-chat-react-native';
import { ChatScreenHeader } from '../components/ChatScreenHeader';
import { DraftsList } from '../components/DraftsList';

export type DraftsScreenProps = {
  navigation: StackNavigationProp<BottomTabNavigatorParamList, 'DraftsScreen'>;
};

export const DraftsScreen: React.FC<DraftsScreenProps> = () => {
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
      <DraftsList />
    </View>
  );
};

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
