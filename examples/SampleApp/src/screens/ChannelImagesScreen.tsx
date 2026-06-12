import React from 'react';
import { StyleSheet } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import type { RouteProp } from '@react-navigation/native';
import { ChannelDetailsContextProvider, MediaList, useTheme } from 'stream-chat-react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import { useLegacyColors } from '../theme/useLegacyColors';

import type { StackNavigatorParamList } from '../types';

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

type ChannelImagesScreenRouteProp = RouteProp<StackNavigatorParamList, 'ChannelImagesScreen'>;

export type ChannelImagesScreenProps = {
  route: ChannelImagesScreenRouteProp;
};

export const ChannelImagesScreen: React.FC<ChannelImagesScreenProps> = ({
  route: {
    params: { channel },
  },
}) => {
  useTheme();
  const { white } = useLegacyColors();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: white }]}>
      <ScreenHeader inSafeArea titleText='Photos and Videos' />
      <ChannelDetailsContextProvider value={{ channel }}>
        <MediaList />
      </ChannelDetailsContextProvider>
    </SafeAreaView>
  );
};
