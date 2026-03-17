import React, { useMemo, useState } from 'react';
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
import { LiveLocationCreateModal } from './LocationSharing/CreateLocationModal';

export const CustomAttachmentPickerSelectionBar = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const { attachmentPickerStore } = useAttachmentPickerContext();
  const { selectedPicker } = useAttachmentPickerState();

  const styles = useStyles();

  const onRequestClose = () => {
    setModalVisible(false);
  };

  const onOpenModal = useStableCallback(() => {
    attachmentPickerStore.setSelectedPicker('location');
    setModalVisible(true);
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
      {modalVisible ? (
        <LiveLocationCreateModal visible={modalVisible} onRequestClose={onRequestClose} />
      ) : null}
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
