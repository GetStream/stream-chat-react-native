import React from 'react';
import { StyleSheet, View } from 'react-native';

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
    <View style={[styles.flex]}>
      <ScreenHeader titleText='Photos and Videos' />
      <ChannelDetailsContextProvider channel={channel}>
        <SafeAreaView edges={['left', 'right']} style={styles.flex}>
          <MediaList />
        </SafeAreaView>
      </ChannelDetailsContextProvider>
    </View>
  );
};
