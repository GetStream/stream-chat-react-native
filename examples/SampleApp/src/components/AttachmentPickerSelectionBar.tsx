import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AttachmentTypePickerButton,
  useAttachmentPickerState,
  CameraPickerButton,
  CommandsPickerButton,
  FilePickerButton,
  MediaPickerButton,
  PollPickerButton,
  useAttachmentPickerContext,
  useStableCallback,
  useTheme,
} from 'stream-chat-react-native';
import { ShareLocationIcon } from '../icons/ShareLocationIcon';

export const CustomAttachmentPickerSelectionBar = () => {
  const { attachmentPickerStore } = useAttachmentPickerContext();
  const { selectedPicker } = useAttachmentPickerState();

  const styles = useStyles();

  const onOpenModal = useStableCallback(() => {
    attachmentPickerStore.setSelectedPicker('location');
  });

  return (
    <View style={styles.selectionBar}>
      <MediaPickerButton />
      <CameraPickerButton />
      <FilePickerButton />
      <PollPickerButton />
      <CommandsPickerButton />
      <AttachmentTypePickerButton
        Icon={ShareLocationIcon}
        onPress={onOpenModal}
        selected={selectedPicker === 'location'}
      />
    </View>
  );
};

const useStyles = () => {
  const { theme: { semantics }} = useTheme();
  return useMemo(() => StyleSheet.create({
    selectionBar: {
      backgroundColor: semantics.backgroundCoreElevation1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
  }), [semantics])
}
