import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { ComponentOverrides } from 'stream-chat-expo';
import { InputButtons as DefaultInputButtons } from 'stream-chat-expo';
import { ShareLocationIcon } from '../icons/ShareLocationIcon';
import { LiveLocationCreateModal } from './LocationSharing/CreateLocationModal';

const InputButtons: NonNullable<ComponentOverrides['InputButtons']> = (props) => {
  const [modalVisible, setModalVisible] = useState(false);

  const onRequestClose = () => {
    setModalVisible(false);
  };

  const onOpenModal = () => {
    setModalVisible(true);
  };

  return (
    <>
      <DefaultInputButtons {...props} hasCommands={false} />
      <Pressable style={styles.liveLocationButton} onPress={onOpenModal}>
        <ShareLocationIcon />
      </Pressable>
      <LiveLocationCreateModal visible={modalVisible} onRequestClose={onRequestClose} />
    </>
  );
};

const styles = StyleSheet.create({
  liveLocationButton: {
    paddingLeft: 5,
  },
});

export default InputButtons;
