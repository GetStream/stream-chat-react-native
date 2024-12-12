import React from 'react';

import { Alert, ImageBackground, StyleSheet, Text, View } from 'react-native';

import { TouchableOpacity } from '@gorhom/bottom-sheet';
import { lookup } from 'mime-types';

import { AttachmentPickerContextValue } from '../../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useViewport } from '../../../hooks/useViewport';
import { Recorder } from '../../../icons';
import type { Asset, File } from '../../../types/types';
import { getDurationLabelFromDuration } from '../../../utils/utils';

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

const AttachmentVideo = (props: AttachmentVideoProps) => {
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
  const { vw } = useViewport();
  const { t } = useTranslationContext();

  const {
    theme: {
      attachmentPicker: { durationText, image, imageOverlay },
      colors: { overlay, white },
    },
  } = useTheme();

  const { duration: videoDuration, id: assetId, originalUri, uri } = asset;

  const durationLabel = getDurationLabelFromDuration(videoDuration);

  const size = vw(100) / (numberOfAttachmentPickerImageColumns || 3) - 2;

  /* Patches video files with uri and mimetype */
  const patchVideoFile = (files: File[]) => {
    // We need a mime-type to upload a video file.
    const mimeType = lookup(asset.name) || 'multipart/form-data';
    return [
      ...files,
      {
        duration: asset.duration,
        id: asset.id,
        mimeType,
        name: asset.name,
        originalUri,
        size: asset.size,
        uri,
      },
    ];
  };

  const updateSelectedFiles = () => {
    if (numberOfUploads >= maxNumberOfFiles) {
      Alert.alert(t('Maximum number of files reached'));
      return;
    }
    const files = patchVideoFile(selectedFiles);
    setSelectedFiles(files);
  };

  const onPressVideo = () => {
    if (selected) {
      setSelectedFiles((files) =>
        // `id` is available for Expo MediaLibrary while Cameraroll doesn't share id therefore we use `uri`
        files.filter((file) =>
          file.id ? file.id !== assetId : file.uri !== uri && file.originalUri !== uri,
        ),
      );
    } else {
      updateSelectedFiles();
    }
  };

  return (
    <TouchableOpacity onPress={onPressVideo}>
      <ImageBackground
        source={{ uri: originalUri }}
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
            <Text style={[{ color: white }, styles.durationText, durationText]}>
              {durationLabel}
            </Text>
          ) : null}
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const AttachmentImage = (props: AttachmentImageProps) => {
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
  const { vw } = useViewport();
  const { t } = useTranslationContext();

  const size = vw(100) / (numberOfAttachmentPickerImageColumns || 3) - 2;

  const { id: assetId, originalUri, uri } = asset;

  const updateSelectedImages = () => {
    if (numberOfUploads >= maxNumberOfFiles) {
      Alert.alert(t('Maximum number of files reached'));
      return;
    }
    setSelectedImages([...selectedImages, asset]);
  };

  const onPressImage = () => {
    if (selected) {
      // `id` is available for Expo MediaLibrary while Cameraroll doesn't share id therefore we use `uri`
      setSelectedImages((images) =>
        images.filter((image) =>
          assetId ? image.id !== assetId : image.uri !== uri && originalUri !== uri,
        ),
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
