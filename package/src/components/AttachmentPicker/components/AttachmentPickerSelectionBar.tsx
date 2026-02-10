import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  CameraPickerButton,
  CommandsPickerButton,
  FilePickerButton,
  MediaPickerButton,
  PollPickerButton,
} from './AttachmentTypePickerButton';

import { useMessageInputContext } from '../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 6,
  },
  icon: {
    marginHorizontal: 12,
  },
});

export const AttachmentPickerSelectionBar = () => {
  const { attachmentSelectionBarHeight } = useMessageInputContext();

  const {
    theme: {
      attachmentSelectionBar: { container },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container, { height: attachmentSelectionBarHeight }]}>
      <MediaPickerButton />
      <CameraPickerButton />
      <FilePickerButton />
      <PollPickerButton />
      <CommandsPickerButton />
    </View>
  );
};
