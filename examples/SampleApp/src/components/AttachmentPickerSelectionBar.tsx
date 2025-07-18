import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AttachmentPickerSelectionBar, useMessageInputContext } from 'stream-chat-react-native';
import { ShareLocationIcon } from '../icons/ShareLocationIcon';
import { LiveLocationCreateModal } from './LiveLocation/CreateLocationModal';

export const CustomAttachmentPickerSelectionBar = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const { closeAttachmentPicker } = useMessageInputContext();

  const onRequestClose = () => {
    setModalVisible(false);
    closeAttachmentPicker();
  };

  const onOpenModal = () => {
    setModalVisible(true);
  };

  return (
    <View style={styles.selectionBar}>
      <AttachmentPickerSelectionBar />
      <Pressable style={styles.liveLocationButton} onPress={onOpenModal}>
        <ShareLocationIcon />
      </Pressable>
      <LiveLocationCreateModal visible={modalVisible} onRequestClose={onRequestClose} />
    </View>
  );
};

const styles = StyleSheet.create({
  selectionBar: { flexDirection: 'row', alignItems: 'center' },
  liveLocationButton: {
    paddingLeft: 4,
  },
});
