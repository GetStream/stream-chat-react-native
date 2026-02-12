import React, { useState } from 'react';
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
} from 'stream-chat-react-native';
import { ShareLocationIcon } from '../icons/ShareLocationIcon';
import { LiveLocationCreateModal } from './LocationSharing/CreateLocationModal';

export const CustomAttachmentPickerSelectionBar = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const { attachmentPickerStore } = useAttachmentPickerContext();
  const { selectedPicker } = useAttachmentPickerState();

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

const styles = StyleSheet.create({
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
});
