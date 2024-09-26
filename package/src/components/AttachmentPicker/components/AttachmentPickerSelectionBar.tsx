import React, { useCallback } from 'react';
import { Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useChatContext } from '../../../contexts';
import { useAttachmentPickerContext } from '../../../contexts/attachmentPickerContext/AttachmentPickerContext';
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

export const CreatePollModalContent = (props: { setShowModal: (val: boolean) => void }) => {
  const { setShowModal } = props;
  const { sendMessage } = useMessageInputContext();
  const { client } = useChatContext();

  const createAndSendPoll = useCallback(async () => {
    // TODO: replace with stateful name
    const pollName = 'testing-polls';
    const poll = await client.polls.createPoll({ name: pollName });
    console.log('CREATED POLL: ', poll.id);
    await sendMessage({ customMessageData: { poll_id: poll.id as string } });
  }, [client, sendMessage]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => setShowModal(false)}>
          <Text>BACK</Text>
        </TouchableOpacity>
        <Text>THIS IS A MODAL</Text>
        <TouchableOpacity onPress={createAndSendPoll}>
          <Text>SEND</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export const AttachmentPickerSelectionBar = () => {
  const [showModal, setShowModal] = React.useState(false);
  const {
    attachmentSelectionBarHeight,
    CameraSelectorIcon,
    closePicker,
    CreatePollIcon,
    FileSelectorIcon,
    ImageSelectorIcon,
    selectedPicker,
    setSelectedPicker,
  } = useAttachmentPickerContext();

  const { hasCameraPicker, hasFilePicker, imageUploads, pickFile, takeAndUploadImage } =
    useMessageInputContext();

  const {
    theme: {
      attachmentSelectionBar: { container, icon },
    },
  } = useTheme();

  const setImagePicker = () => {
    if (selectedPicker === 'images') {
      setSelectedPicker(undefined);
      closePicker();
    } else {
      setSelectedPicker('images');
    }
  };

  const openFilePicker = () => {
    setSelectedPicker(undefined);
    closePicker();
    pickFile();
  };

  return (
    <View style={[styles.container, container, { height: attachmentSelectionBarHeight }]}>
      <TouchableOpacity
        hitSlop={{ bottom: 15, top: 15 }}
        onPress={setImagePicker}
        testID='upload-photo-touchable'
      >
        <View style={[styles.icon, icon]}>
          <ImageSelectorIcon
            numberOfImageUploads={imageUploads.length}
            selectedPicker={selectedPicker}
          />
        </View>
      </TouchableOpacity>
      {hasFilePicker ? (
        <TouchableOpacity
          hitSlop={{ bottom: 15, top: 15 }}
          onPress={openFilePicker}
          testID='upload-file-touchable'
        >
          <View style={[styles.icon, icon]}>
            <FileSelectorIcon
              numberOfImageUploads={imageUploads.length}
              selectedPicker={selectedPicker}
            />
          </View>
        </TouchableOpacity>
      ) : null}
      {hasCameraPicker ? (
        <TouchableOpacity
          hitSlop={{ bottom: 15, top: 15 }}
          onPress={takeAndUploadImage}
          testID='take-photo-touchable'
        >
          <View style={[styles.icon, icon]}>
            <CameraSelectorIcon
              numberOfImageUploads={imageUploads.length}
              selectedPicker={selectedPicker}
            />
          </View>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity
        hitSlop={{ bottom: 15, top: 15 }}
        onPress={() => setShowModal(true)}
        testID='create-poll-touchable'
      >
        <View style={[styles.icon, icon]}>
          <CreatePollIcon />
        </View>
      </TouchableOpacity>
      <Modal animationType='slide' onRequestClose={() => setShowModal(false)} visible={showModal}>
        <CreatePollModalContent setShowModal={setShowModal} />
      </Modal>
    </View>
  );
};
