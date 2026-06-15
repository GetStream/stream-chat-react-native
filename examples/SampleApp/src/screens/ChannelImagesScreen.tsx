import React from 'react';
import { StyleSheet } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import type { RouteProp } from '@react-navigation/native';
import { ChannelDetailsContextProvider, MediaList } from 'stream-chat-react-native';

import { ScreenHeader } from '../components/ScreenHeader';

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
  return (
    <SafeAreaView style={[styles.flex]}>
      <ScreenHeader inSafeArea titleText='Photos and Videos' />
      <ChannelDetailsContextProvider value={{ channel }}>
        <MediaList />
      </ChannelDetailsContextProvider>
    </SafeAreaView>
  );
};
