import React from 'react';
import { StyleSheet, View } from 'react-native';

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
    <View style={[styles.flex]}>
      <ScreenHeader titleText='Files' />
      <ChannelDetailsContextProvider value={{ channel }}>
        <FileAttachmentList />
      </ChannelDetailsContextProvider>
    </View>
  );
};
