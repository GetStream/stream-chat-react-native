import React from 'react';

import { StyleSheet, View } from 'react-native';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from 'stream-chat-react-native';

import { ChatScreenHeader } from '../components/ChatScreenHeader';
import { DraftsList } from '../components/DraftsList';
import { useLegacyColors } from '../theme/useLegacyColors';
import { BottomTabNavigatorParamList } from '../types';

export type DraftsScreenProps = {
  navigation: NativeStackNavigationProp<BottomTabNavigatorParamList, 'DraftsScreen'>;
};

export const DraftsScreen: React.FC<DraftsScreenProps> = () => {
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
