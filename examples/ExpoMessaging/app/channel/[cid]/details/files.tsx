import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChannelDetailsContextProvider, FileAttachmentList, useTheme } from 'stream-chat-expo';

import { ScreenHeader } from '../../../../components/ScreenHeader';
import { AppContext } from '../../../../context/AppContext';

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

export default function ChannelFilesScreen() {
  useTheme();
  const { channel } = useContext(AppContext);

  if (!channel) {
    return null;
  }

  return (
    <View style={styles.flex}>
      <ScreenHeader titleText='Files' />
      <ChannelDetailsContextProvider value={{ channel }}>
        <FileAttachmentList />
      </ChannelDetailsContextProvider>
    </View>
  );
}
