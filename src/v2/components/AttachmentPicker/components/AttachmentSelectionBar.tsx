import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { takePhoto } from '../../../native';

import { useAttachmentPickerContext } from '../../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { useMessageInputContext } from '../../../contexts/messageInputContext/MessageInputContext';
import { Camera, Folder, Picture } from '../../../icons';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 52,
    paddingHorizontal: 6,
  },
  icon: {
    marginHorizontal: 12,
  },
});

export const AttachmentSelectionBar: React.FC = () => {
  const {
    closePicker,
    selectedPicker,
    setSelectedImages,
    setSelectedPicker,
  } = useAttachmentPickerContext();

  const { hasFilePicker, imageUploads, pickFile } = useMessageInputContext();

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
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setPicker('images')}>
        <View style={styles.icon}>
          <Picture
            pathFill={selectedPicker === 'images' ? '#005FFF' : '#7A7A7A'}
          />
        </View>
      </TouchableOpacity>
      {hasFilePicker && (
        <TouchableOpacity
          disabled={imageUploads.length > 0}
          onPress={openFilePicker}
        >
          <View style={styles.icon}>
            <Folder
              pathFill={imageUploads.length === 0 ? '#7A7A7A' : '#DBDBDB'}
            />
          </View>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={takeAndUploadImage}>
        <View style={styles.icon}>
          <Camera pathFill={'#7A7A7A'} />
        </View>
      </TouchableOpacity>
    </View>
  );
};
