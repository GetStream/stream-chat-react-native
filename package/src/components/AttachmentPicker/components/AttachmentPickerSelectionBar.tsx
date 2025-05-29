import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useAttachmentPickerContext } from '../../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useMessageInputContext } from '../../../contexts/messageInputContext/MessageInputContext';
import { useMessagesContext } from '../../../contexts/messagesContext/MessagesContext';
import { useOwnCapabilitiesContext } from '../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
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
  const {
    attachmentSelectionBarHeight,
    CameraSelectorIcon,
    closePicker,
    CreatePollIcon,
    FileSelectorIcon,
    ImageSelectorIcon,
    selectedPicker,
    setSelectedPicker,
    VideoRecorderSelectorIcon,
  } = useAttachmentPickerContext();

  const {
    hasCameraPicker,
    hasFilePicker,
    hasImagePicker,
    openPollCreationDialog,
    pickFile,
    sendMessage,
    takeAndUploadImage,
  } = useMessageInputContext();
  const { threadList } = useChannelContext();
  const { hasCreatePoll } = useMessagesContext();
  const ownCapabilities = useOwnCapabilitiesContext();

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

  const openPollCreationModal = () => {
    setSelectedPicker(undefined);
    closePicker();
    openPollCreationDialog?.({ sendMessage });
  };

  return (
    <View style={[styles.container, container, { height: attachmentSelectionBarHeight }]}>
      {hasImagePicker ? (
        <TouchableOpacity
          hitSlop={{ bottom: 15, top: 15 }}
          onPress={setImagePicker}
          testID='upload-photo-touchable'
        >
          <View style={[styles.icon, icon]}>
            <ImageSelectorIcon selectedPicker={selectedPicker} />
          </View>
        </TouchableOpacity>
      ) : null}
      {hasFilePicker ? (
        <TouchableOpacity
          hitSlop={{ bottom: 15, top: 15 }}
          onPress={openFilePicker}
          testID='upload-file-touchable'
        >
          <View style={[styles.icon, icon]}>
            <FileSelectorIcon selectedPicker={selectedPicker} />
          </View>
        </TouchableOpacity>
      ) : null}
      {hasCameraPicker ? (
        <TouchableOpacity
          hitSlop={{ bottom: 15, top: 15 }}
          onPress={() => {
            takeAndUploadImage(Platform.OS === 'android' ? 'image' : 'mixed');
          }}
          testID='take-photo-touchable'
        >
          <View style={[styles.icon, icon]}>
            <CameraSelectorIcon selectedPicker={selectedPicker} />
          </View>
        </TouchableOpacity>
      ) : null}
      {hasCameraPicker && Platform.OS === 'android' ? (
        <TouchableOpacity
          hitSlop={{ bottom: 15, top: 15 }}
          onPress={() => {
            takeAndUploadImage('video');
          }}
          testID='take-photo-touchable'
        >
          <View style={[styles.icon, { marginTop: 4 }, icon]}>
            <VideoRecorderSelectorIcon selectedPicker={selectedPicker} />
          </View>
        </TouchableOpacity>
      ) : null}
      {!threadList && hasCreatePoll && ownCapabilities.sendPoll ? ( // do not allow poll creation in threads
        <TouchableOpacity
          hitSlop={{ bottom: 15, top: 15 }}
          onPress={openPollCreationModal}
          testID='create-poll-touchable'
        >
          <View style={[styles.icon, icon]}>
            <CreatePollIcon />
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};
