import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useAttachmentPickerContext } from '../../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { useMessageInputContext } from '../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import { takePhoto } from '../../../native';

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

export const AttachmentSelectionBar: React.FC = () => {
  const {
    attachmentSelectionBarHeight,
    CameraSelectorIcon,
    closePicker,
    FileSelectorIcon,
    ImageSelectorIcon,
    selectedPicker,
    setSelectedImages,
    setSelectedPicker,
  } = useAttachmentPickerContext();

  const { hasFilePicker, imageUploads, pickFile } = useMessageInputContext();

  const {
    theme: {
      attachmentSelectionBar: { container, icon },
    },
  } = useTheme();

  const setPicker = (selection: 'images') => {
    if (selectedPicker === selection) {
      setSelectedPicker(undefined);
      closePicker();
    } else {
      setSelectedPicker(selection);
    }
  };

  const openFilePicker = () => {
    setSelectedPicker(undefined);
    closePicker();
    pickFile();
  };

  const takeAndUploadImage = async () => {
    setSelectedPicker(undefined);
    closePicker();
    const photo = await takePhoto();
    if (!photo.cancelled) {
      setSelectedImages((images) => [...images, photo.uri]);
    }
  };

  return (
    <View
      style={[
        styles.container,
        container,
        { height: attachmentSelectionBarHeight ?? 52 },
      ]}
    >
      <TouchableOpacity onPress={() => setPicker('images')}>
        <View style={[styles.icon, icon]}>
          <ImageSelectorIcon
            numberOfImageUploads={imageUploads.length}
            selectedPicker={selectedPicker}
          />
        </View>
      </TouchableOpacity>
      {hasFilePicker && (
        <TouchableOpacity
          disabled={imageUploads.length > 0}
          onPress={openFilePicker}
        >
          <View style={[styles.icon, icon]}>
            <FileSelectorIcon
              numberOfImageUploads={imageUploads.length}
              selectedPicker={selectedPicker}
            />
          </View>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={takeAndUploadImage}>
        <View style={[styles.icon, icon]}>
          <CameraSelectorIcon
            numberOfImageUploads={imageUploads.length}
            selectedPicker={selectedPicker}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};
