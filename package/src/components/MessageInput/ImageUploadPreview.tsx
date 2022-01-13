import React from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { UploadProgressIndicator } from './UploadProgressIndicator';

import {
  ImageUpload,
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Close } from '../../icons/Close';
import type { StreamChatGenerics } from '../../types/types';
import { FileState, ProgressIndicatorTypes } from '../../utils/utils';

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
});

type ImageUploadPreviewPropsWithContext<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Pick<
  MessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  'imageUploads' | 'removeImage' | 'uploadImage'
>;

export type ImageUploadPreviewProps<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Partial<ImageUploadPreviewPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

const ImageUploadPreviewWithContext = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: ImageUploadPreviewPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { imageUploads, removeImage, uploadImage } = props;

  const {
    theme: {
      colors: { overlay, white },
      messageInput: {
        imageUploadPreview: { dismiss, flatList, itemContainer, upload },
      },
    },
  } = useTheme();

  const renderItem = ({ index, item }: { index: number; item: ImageUpload }) => (
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
        active={item.state !== FileState.UPLOADED && item.state !== FileState.FINISHED}
        style={styles.upload}
        type={
          item.state === FileState.UPLOADING
            ? ProgressIndicatorTypes.IN_PROGRESS
            : item.state === FileState.UPLOAD_FAILED
            ? ProgressIndicatorTypes.RETRY
            : undefined
        }
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
        <Close pathFill={white} />
      </TouchableOpacity>
    </View>
  );

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

const areEqual = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: ImageUploadPreviewPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: ImageUploadPreviewPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
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
export const ImageUploadPreview = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: ImageUploadPreviewProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { imageUploads, removeImage, uploadImage } =
    useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us>();

  return (
    <MemoizedImageUploadPreviewWithContext
      {...{ imageUploads, removeImage, uploadImage }}
      {...props}
    />
  );
};

ImageUploadPreview.displayName = 'ImageUploadPreview{messageInput{imageUploadPreview}}';
