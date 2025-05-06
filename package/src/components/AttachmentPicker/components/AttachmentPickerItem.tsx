import React from 'react';

import { Alert, ImageBackground, StyleSheet, Text, View } from 'react-native';

import { AttachmentPickerContextValue } from '../../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useViewport } from '../../../hooks/useViewport';
import { Recorder } from '../../../icons';
import type { File } from '../../../types/types';
import { getDurationLabelFromDuration } from '../../../utils/utils';
import { BottomSheetTouchableOpacity } from '../../BottomSheetCompatibility/BottomSheetTouchableOpacity';
type AttachmentPickerItemType = Pick<
  AttachmentPickerContextValue,
  'selectedFiles' | 'setSelectedFiles' | 'setSelectedImages' | 'selectedImages' | 'maxNumberOfFiles'
> & {
  asset: File;
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

  const { duration: videoDuration, thumb_url, uri } = asset;

  const durationLabel = videoDuration ? getDurationLabelFromDuration(videoDuration) : '00:00';

  const size = vw(100) / (numberOfAttachmentPickerImageColumns || 3) - 2;

  const updateSelectedFiles = () => {
    if (numberOfUploads >= maxNumberOfFiles) {
      Alert.alert(t('Maximum number of files reached'));
      return;
    }
    setSelectedFiles([...selectedFiles, asset]);
  };

  const onPressVideo = () => {
    if (selected) {
      setSelectedFiles((files) =>
        // `id` is available for Expo MediaLibrary while Cameraroll doesn't share id therefore we use `uri`
        files.filter((file) => file.uri !== uri),
      );
    } else {
      updateSelectedFiles();
    }
  };

  return (
    <BottomSheetTouchableOpacity onPress={onPressVideo}>
      <ImageBackground
        source={{ uri: thumb_url }}
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
          <Recorder height={20} pathFill={white} width={20} />
          {videoDuration ? (
            <Text style={[{ color: white }, styles.durationText, durationText]}>
              {durationLabel}
            </Text>
          ) : null}
        </View>
      </ImageBackground>
    </BottomSheetTouchableOpacity>
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

  const { uri } = asset;

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
      setSelectedImages((images) => images.filter((image) => image.uri !== uri));
    } else {
      updateSelectedImages();
    }
  };

  return (
    <BottomSheetTouchableOpacity onPress={onPressImage}>
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
    </BottomSheetTouchableOpacity>
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
