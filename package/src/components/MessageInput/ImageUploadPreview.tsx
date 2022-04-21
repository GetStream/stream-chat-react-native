import React from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, View, Text } from 'react-native';

import { UploadProgressIndicator } from './UploadProgressIndicator';

import {
  ImageUpload,
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Close } from '../../icons/Close';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { FileState, ProgressIndicatorTypes } from '../../utils/utils';
import { Warning } from '../../icons';

const IMAGE_PREVIEW_SIZE = 100;

const styles = StyleSheet.create({
  dismiss: {
    borderRadius: 24,
    position: 'absolute',
    right: 8,
    top: 8,
  },
  flatList: { paddingBottom: 12 },
  itemContainer: {
    flexDirection: 'row',
    height: IMAGE_PREVIEW_SIZE,
    marginLeft: 8,
  },
  upload: {
    borderRadius: 10,
    height: IMAGE_PREVIEW_SIZE,
    width: IMAGE_PREVIEW_SIZE,
  },
  fileSizeText: {
    fontSize: 12,
    paddingLeft: 10,
  },

  unsupportedContainer: {
    borderRadius: 20,
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    marginLeft: 3,
  },
  unsupportedView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningIconStyle: {
    borderRadius: 24,
    right: 0,
    top: 2,
    left: 8,
    bottom: 8,
  },
  warningText: {
    color: 'black',
    fontSize: 10,
    paddingRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
      colors: { overlay, white, accent_red },
      messageInput: {
        imageUploadPreview: { dismiss, flatList, itemContainer, upload },
      },
    },
  } = useTheme();

  const getIndicatorTypeForFileState = (fileState: string) => {
    const indicatorMap = {
      [FileState.UPLOADING]: ProgressIndicatorTypes.IN_PROGRESS,
      [FileState.UPLOAD_FAILED]: ProgressIndicatorTypes.RETRY,
      [FileState.NOT_SUPPORTED]: ProgressIndicatorTypes.NOT_SUPPORTED,
      [FileState.UPLOADED]: ProgressIndicatorTypes.INACTIVE,
      [FileState.FINISHED]: ProgressIndicatorTypes.INACTIVE,
    };

    if (Object.keys(indicatorMap).includes(fileState)) {
      return indicatorMap[fileState];
    }

    return null;
  };

  const renderItem = ({ index, item }: ImageUploadPreviewItem) => {
    const indicatorType = getIndicatorTypeForFileState(item.state);

    return (
      <View
        style={[
          styles.itemContainer,
          index === imageUploads.length - 1 ? { marginRight: 8 } : {},
          itemContainer,
        ]}
      >
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
        >
          <Close pathFill={white} />
        </TouchableOpacity>
        {indicatorType === ProgressIndicatorTypes.NOT_SUPPORTED ? (
          <View style={[styles.unsupportedContainer, { backgroundColor: overlay }]}>
            <View style={styles.unsupportedView}>
              <Warning
                style={styles.warningIconStyle}
                height={17}
                pathFill={accent_red}
                testID=''
                width={17}
              />
              <Text style={styles.warningText}>{'   Not supported'}</Text>
            </View>
          </View>
        ) : null}
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
