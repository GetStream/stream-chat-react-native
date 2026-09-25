import React from 'react';
import { StyleSheet, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import type { RouteProp } from '@react-navigation/native';
import {
  ChannelDetailsContextProvider,
  FileAttachmentList,
  useTheme,
} from 'stream-chat-react-native';

import { ScreenHeader } from '../components/ScreenHeader';

import type { StackNavigatorParamList } from '../types';

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});

type ChannelFilesScreenRouteProp = RouteProp<StackNavigatorParamList, 'ChannelFilesScreen'>;

export type ChannelFilesScreenProps = {
  route: ChannelFilesScreenRouteProp;
};

export const ChannelFilesScreen: React.FC<ChannelFilesScreenProps> = ({
  route: {
    params: { channel },
  },
}) => {
  useTheme();

  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.flex]}>
      <ScreenHeader titleText='Files' />
      <ChannelDetailsContextProvider channel={channel}>
        <View style={styles.flex}>
          <FileAttachmentList />
        </View>
      </ChannelDetailsContextProvider>
    </SafeAreaView>
  );
};
