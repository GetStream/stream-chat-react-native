import React, { useCallback, useState } from 'react';
import { Modal, TouchableOpacity, View, ViewStyle } from 'react-native';

import { useAttachmentPickerContext } from '../../../contexts';
import { CreatePollContent } from '../CreatePollContent';

export const CreatePollButton = (props: { style: ViewStyle | ViewStyle[] }) => {
  const { style } = props;
  const [showModal, setShowModal] = useState(false);
  const { CreatePollIcon } = useAttachmentPickerContext();
  const handleClose = useCallback(() => setShowModal(false), []);
  return (
    <>
      <TouchableOpacity
        hitSlop={{ bottom: 15, top: 15 }}
        onPress={() => setShowModal(true)}
        testID='create-poll-touchable'
      >
        <View style={style}>
          <CreatePollIcon />
        </View>
      </TouchableOpacity>
      <Modal animationType='slide' onRequestClose={() => setShowModal(false)} visible={showModal}>
        <CreatePollContent handleClose={handleClose} />
      </Modal>
    </>
  );
};
