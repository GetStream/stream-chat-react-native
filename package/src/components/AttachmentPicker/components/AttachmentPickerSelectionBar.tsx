import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  CameraPickerButton,
  CommandsPickerButton,
  FilePickerButton,
  MediaPickerButton,
  PollPickerButton,
} from './AttachmentTypePickerButton';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: semantics.backgroundCoreElevation1,
          paddingBottom: primitives.spacingSm,
          paddingHorizontal: primitives.spacingMd,
          alignItems: 'center',
          flexDirection: 'row',
        },
      }),
    [semantics.backgroundCoreElevation1],
  );
};

export const AttachmentPickerSelectionBar = () => {
  const {
    theme: {
      attachmentSelectionBar: { container },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.container, container]}>
      <MediaPickerButton />
      <CameraPickerButton />
      <FilePickerButton />
      <PollPickerButton />
      <CommandsPickerButton />
    </View>
  );
};
