import React from 'react';

import { Alert, ImageBackground, Platform, StyleSheet, Text, View } from 'react-native';

import { TouchableOpacity } from '@gorhom/bottom-sheet';
import dayjs from 'dayjs';
import { lookup } from 'mime-types';

import type { AttachmentPickerContextValue } from '../../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Recorder } from '../../../icons';
import { getLocalAssetUri } from '../../../native';
import type { Asset, File } from '../../../types/types';
import { vw } from '../../../utils/utils';

type AttachmentPickerItemType = Pick<
  AttachmentPickerContextValue,
  'selectedFiles' | 'setSelectedFiles' | 'setSelectedImages' | 'selectedImages' | 'maxNumberOfFiles'
> & {
  asset: Asset;
  ImageOverlaySelectedComponent: React.ComponentType;
  numberOfUploads: number;
  selected: boolean;
  numberOfAttachmentPickerImageColumns?: number;
};

type AttachmentImageProps = Omit<AttachmentPickerItemType, 'setSelectedFiles' | 'selectedFiles'>;

type AttachmentVideoProps = Omit<AttachmentPickerItemType, 'setSelectedImages' | 'selectedImages'>;

const AttachmentVideo: React.FC<AttachmentVideoProps> = (props) => {
  const {
    asset,
    ImageOverlaySelectedComponent,
    maxNumberOfFiles,
    numberOfAttachmentPickerImageColumns,
    numberOfUploads,
    selected,
    selectedFiles,
    setSelectedFiles,
  } = props;

  const {
    theme: {
      attachmentPicker: { durationText, image, imageOverlay },
      colors: { overlay, white },
    },
  } = useTheme();

  const { duration: videoDuration, uri } = asset;

  const ONE_HOUR_IN_SECONDS = 3600;

  let durationLabel = '00:00';

  if (videoDuration) {
    const isDurationLongerThanHour = videoDuration / ONE_HOUR_IN_SECONDS >= 1;
    const formattedDurationParam = isDurationLongerThanHour ? 'HH:mm:ss' : 'mm:ss';
    const formattedVideoDuration = dayjs
      .duration(videoDuration, 'second')
      .format(formattedDurationParam);
    durationLabel = formattedVideoDuration;
  }

  const size = vw(100) / (numberOfAttachmentPickerImageColumns || 3) - 2;

  /* Patches video files with uri and mimetype */
  const patchVideoFile = async (files: File[]) => {
    // For the case of Expo CLI where you need to fetch the file uri from file id. Here it is only done for iOS since for android the file.uri is fine.
    const localAssetURI = Platform.OS === 'ios' && asset.id && (await getLocalAssetUri(asset.id));
    const uri = localAssetURI || asset.uri || '';
    // We need a mime-type to upload a video file.
    const mimeType = lookup(asset.filename) || 'multipart/form-data';
    return [
      ...files,
      {
        duration: durationLabel,
        id: asset.id,
        mimeType,
        name: asset.filename,
        size: asset.fileSize,
        uri,
      },
    ];
  };

  const updateSelectedFiles = async () => {
    if (numberOfUploads >= maxNumberOfFiles) {
      Alert.alert('Maximum number of files reached');
      return;
    }
    const files = await patchVideoFile(selectedFiles);
    setSelectedFiles(files);
  };

  const onPressVideo = () => {
    if (selected) {
      setSelectedFiles((files) =>
        // `id` is available for Expo MediaLibrary while Cameraroll doesn't share id therefore we use `uri`
        files.filter((file) => (file.id ? file.id !== asset.id : file.uri !== asset.uri)),
      );
    } else {
      updateSelectedFiles();
    }
  };

  return (
    <TouchableOpacity onPress={onPressVideo}>
      <ImageBackground
        source={{ uri }}
        style={[
          {
            height: size,
            margin: 1,
            width: size,
          },
          image,
        ]}
      >
        {selected && (
          <View style={[styles.overlay, { backgroundColor: overlay }, imageOverlay]}>
            <ImageOverlaySelectedComponent />
          </View>
        )}
        <View style={styles.videoView}>
          <Recorder height={20} pathFill={white} width={25} />
          {videoDuration ? (
            <Text style={[styles.durationText, durationText, { color: white }]}>
              {durationLabel}
            </Text>
          ) : null}
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const AttachmentImage: React.FC<AttachmentImageProps> = (props) => {
  const {
    asset,
    ImageOverlaySelectedComponent,
    maxNumberOfFiles,
    numberOfAttachmentPickerImageColumns,
    numberOfUploads,
    selected,
    selectedImages,
    setSelectedImages,
  } = props;
  const {
    theme: {
      attachmentPicker: { image, imageOverlay },
      colors: { overlay },
    },
  } = useTheme();

  const size = vw(100) / (numberOfAttachmentPickerImageColumns || 3) - 2;

  const { uri } = asset;

  /* Patches image files with uri */
  const patchImageFile = async (images: Asset[]) => {
    // For the case of Expo CLI where you need to fetch the file uri from file id. Here it is only done for iOS since for android the file.uri is fine.
    const localAssetURI = Platform.OS === 'ios' && asset.id && (await getLocalAssetUri(asset.id));
    const uri = localAssetURI || asset.uri || '';
    return [
      ...images,
      {
        ...asset,
        uri,
      },
    ];
  };

  const updateSelectedImages = async () => {
    if (numberOfUploads >= maxNumberOfFiles) {
      Alert.alert('Maximum number of files reached');
      return;
    }
    const images = await patchImageFile(selectedImages);
    setSelectedImages(images);
  };

  const onPressImage = () => {
    if (selected) {
      // `id` is available for Expo MediaLibrary while Cameraroll doesn't share id therefore we use `uri`
      setSelectedImages((images) =>
        images.filter((image) => (image.id ? image.id !== asset.id : image.uri !== asset.uri)),
      );
    } else {
      updateSelectedImages();
    }
  };

  return (
    <TouchableOpacity onPress={onPressImage}>
      <ImageBackground
        source={{ uri }}
        style={[
          {
            height: size,
            margin: 1,
            width: size,
          },
          image,
        ]}
      >
        {selected && (
          <View style={[styles.overlay, { backgroundColor: overlay }, imageOverlay]}>
            <ImageOverlaySelectedComponent />
          </View>
        )}
      </ImageBackground>
    </TouchableOpacity>
  );
};

export const renderAttachmentPickerItem = ({ item }: { item: AttachmentPickerItemType }) => {
  const {
    asset,
    ImageOverlaySelectedComponent,
    maxNumberOfFiles,
    numberOfAttachmentPickerImageColumns,
    numberOfUploads,
    selected,
    selectedFiles,
    selectedImages,
    setSelectedFiles,
    setSelectedImages,
  } = item;

  /**
   * Expo Media Library - Result of asset type
   * Native Android - Gives mime type(Eg: image/jpeg, video/mp4, etc.)
   * Native iOS - Gives `image` or `video`
   * Expo Android/iOS - Gives `photo` or `video`
   **/
  const isVideoType = asset.type.includes('video');

  if (isVideoType) {
    return (
      <AttachmentVideo
        asset={asset}
        ImageOverlaySelectedComponent={ImageOverlaySelectedComponent}
        maxNumberOfFiles={maxNumberOfFiles}
        numberOfAttachmentPickerImageColumns={numberOfAttachmentPickerImageColumns}
        numberOfUploads={numberOfUploads}
        selected={selected}
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
      />
    );
  }

  return (
    <AttachmentImage
      asset={asset}
      ImageOverlaySelectedComponent={ImageOverlaySelectedComponent}
      maxNumberOfFiles={maxNumberOfFiles}
      numberOfAttachmentPickerImageColumns={numberOfAttachmentPickerImageColumns}
      numberOfUploads={numberOfUploads}
      selected={selected}
      selectedImages={selectedImages}
      setSelectedImages={setSelectedImages}
    />
  );
};

const styles = StyleSheet.create({
  durationText: {
    fontWeight: 'bold',
  },
  overlay: {
    alignItems: 'flex-end',
    flex: 1,
  },
  videoView: {
    bottom: 5,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    position: 'absolute',
    width: '100%',
  },
});
