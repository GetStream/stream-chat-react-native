import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { UploadProgressIndicator } from './UploadProgressIndicator';

import {
  ImageUpload,
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { Close } from '../../icons/Close';
import { Warning } from '../../icons/Warning';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { getIndicatorTypeForFileState, ProgressIndicatorTypes } from '../../utils/utils';

const IMAGE_PREVIEW_SIZE = 100;
const WARNING_ICON_SIZE = 16;

const styles = StyleSheet.create({
  dismiss: {
    borderRadius: 24,
    position: 'absolute',
    right: 8,
    top: 8,
  },
  fileSizeText: {
    fontSize: 12,
    paddingLeft: 10,
  },
  flatList: { paddingBottom: 12 },
  iconContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    height: IMAGE_PREVIEW_SIZE,
    marginLeft: 8,
  },
  unsupportedImage: {
    borderRadius: 20,
    bottom: 8,
    flexDirection: 'row',
    marginLeft: 3,
    position: 'absolute',
  },
  upload: {
    borderRadius: 10,
    height: IMAGE_PREVIEW_SIZE,
    width: IMAGE_PREVIEW_SIZE,
  },
  warningIconStyle: {
    borderRadius: 24,
    marginLeft: 4,
    marginTop: 4,
  },
  warningText: {
    alignItems: 'center',
    color: 'black',
    fontSize: 10,
    justifyContent: 'center',
    paddingRight: 8,
  },
});

type ImageUploadPreviewPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessageInputContextValue<StreamChatGenerics>,
  'imageUploads' | 'removeImage' | 'uploadImage'
>;

export type ImageUploadPreviewProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<ImageUploadPreviewPropsWithContext<StreamChatGenerics>>;

type ImageUploadPreviewItem = { index: number; item: ImageUpload };

const ImageUploadPreviewWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ImageUploadPreviewPropsWithContext<StreamChatGenerics>,
) => {
  const { imageUploads, removeImage, uploadImage } = props;

  const {
    theme: {
      colors: { overlay },
      messageInput: {
        imageUploadPreview: { dismiss, flatList, itemContainer, upload },
      },
    },
  } = useTheme();

  const UnsupportedImageTypeIndicator = ({
    indicatorType,
  }: {
    indicatorType: typeof ProgressIndicatorTypes[keyof typeof ProgressIndicatorTypes] | null;
  }) => {
    const {
      theme: {
        colors: { accent_red, overlay, white },
      },
    } = useTheme();

    const { t } = useTranslationContext();
    return indicatorType === ProgressIndicatorTypes.NOT_SUPPORTED ? (
      <View style={[styles.unsupportedImage, { backgroundColor: overlay }]}>
        <View style={[styles.iconContainer]}>
          <Warning
            height={WARNING_ICON_SIZE}
            pathFill={accent_red}
            style={styles.warningIconStyle}
            width={WARNING_ICON_SIZE}
          />
          <Text style={[styles.warningText, { color: white }]}>{t('Not supported')}</Text>
        </View>
      </View>
    ) : null;
  };

  const renderItem = ({ index, item }: ImageUploadPreviewItem) => {
    const indicatorType = getIndicatorTypeForFileState(item.state);
    const itemMarginForIndex = index === imageUploads.length - 1 ? { marginRight: 8 } : {};

    return (
      <View style={[styles.itemContainer, itemMarginForIndex, itemContainer]}>
        <UploadProgressIndicator
          action={() => {
            uploadImage({ newImage: item });
          }}
          style={styles.upload}
          type={indicatorType}
        >
          <Image
            resizeMode='cover'
            source={{ uri: item.file.uri || item.url }}
            style={[styles.upload, upload]}
          />
        </UploadProgressIndicator>
        <TouchableOpacity
          onPress={() => {
            removeImage(item.id);
          }}
          style={[styles.dismiss, { backgroundColor: overlay }, dismiss]}
          testID='remove-image-upload-preview'
        >
          <Close />
        </TouchableOpacity>
        <UnsupportedImageTypeIndicator indicatorType={indicatorType} />
      </View>
    );
  };

  return imageUploads.length > 0 ? (
    <FlatList
      data={imageUploads}
      getItemLayout={(_, index) => ({
        index,
        length: IMAGE_PREVIEW_SIZE + 8,
        offset: (IMAGE_PREVIEW_SIZE + 8) * index,
      })}
      horizontal
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      style={[styles.flatList, flatList]}
    />
  ) : null;
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: ImageUploadPreviewPropsWithContext<StreamChatGenerics>,
  nextProps: ImageUploadPreviewPropsWithContext<StreamChatGenerics>,
) => {
  const { imageUploads: prevImageUploads } = prevProps;
  const { imageUploads: nextImageUploads } = nextProps;

  return (
    prevImageUploads.length === nextImageUploads.length &&
    prevImageUploads.every(
      (prevImageUpload, index) => prevImageUpload.state === nextImageUploads[index].state,
    )
  );
};

const MemoizedImageUploadPreviewWithContext = React.memo(
  ImageUploadPreviewWithContext,
  areEqual,
) as typeof ImageUploadPreviewWithContext;

/**
 * UI Component to preview the images set for upload
 */
export const ImageUploadPreview = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ImageUploadPreviewProps<StreamChatGenerics>,
) => {
  const { imageUploads, removeImage, uploadImage } = useMessageInputContext<StreamChatGenerics>();

  return (
    <MemoizedImageUploadPreviewWithContext
      {...{ imageUploads, removeImage, uploadImage }}
      {...props}
    />
  );
};

ImageUploadPreview.displayName = 'ImageUploadPreview{messageInput{imageUploadPreview}}';
