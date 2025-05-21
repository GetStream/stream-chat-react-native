import React, { useCallback } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import {
  isLocalImageAttachment,
  isLocalVideoAttachment,
  LocalImageAttachment,
  LocalVideoAttachment,
} from 'stream-chat';

import {
  MessageInputContextValue,
  useMessageComposer,
  useMessageInputContext,
} from '../../contexts';
import { useAttachmentManagerState } from '../../contexts/messageInputContext/hooks/useAttachmentManagerState';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

const IMAGE_PREVIEW_SIZE = 100;

export type ImageUploadPreviewPropsWithContext = Pick<
  MessageInputContextValue,
  'ImageAttachmentUploadPreview' | 'VideoAttachmentUploadPreview'
>;

export type ImageAttachmentPreview<CustomLocalMetadata = Record<string, unknown>> =
  | LocalImageAttachment<CustomLocalMetadata>
  | LocalVideoAttachment<CustomLocalMetadata>;

type ImageUploadPreviewItem = { index: number; item: ImageAttachmentPreview };

/**
 * UI Component to preview the images set for upload
 */
const UnmemoizedImageUploadPreview = (props: ImageUploadPreviewPropsWithContext) => {
  const { ImageAttachmentUploadPreview, VideoAttachmentUploadPreview } = props;
  const { attachmentManager } = useMessageComposer();
  const { attachments } = useAttachmentManagerState();

  const imageOrVideoUploads = attachments.filter(
    (attachment) => isLocalImageAttachment(attachment) || isLocalVideoAttachment(attachment),
  );

  const {
    theme: {
      messageInput: {
        imageUploadPreview: { flatList },
      },
    },
  } = useTheme();

  const renderItem = useCallback(
    ({ item }: ImageUploadPreviewItem) => {
      if (isLocalImageAttachment(item)) {
        return (
          <ImageAttachmentUploadPreview
            attachment={item}
            handleRetry={attachmentManager.uploadAttachment}
            removeAttachments={attachmentManager.removeAttachments}
          />
        );
      } else {
        return (
          <VideoAttachmentUploadPreview
            attachment={item}
            handleRetry={attachmentManager.uploadAttachment}
            removeAttachments={attachmentManager.removeAttachments}
          />
        );
      }
    },
    [
      ImageAttachmentUploadPreview,
      VideoAttachmentUploadPreview,
      attachmentManager.removeAttachments,
      attachmentManager.uploadAttachment,
    ],
  );

  if (!imageOrVideoUploads.length) {
    return null;
  }

  return (
    <FlatList
      data={imageOrVideoUploads}
      getItemLayout={(_, index) => ({
        index,
        length: IMAGE_PREVIEW_SIZE + 8,
        offset: (IMAGE_PREVIEW_SIZE + 8) * index,
      })}
      horizontal
      keyExtractor={(item) => item.localMetadata.id}
      renderItem={renderItem}
      style={[styles.flatList, flatList]}
    />
  );
};

const MemoizedImageUploadPreviewWithContext = React.memo(UnmemoizedImageUploadPreview);

export type ImageUploadPreviewProps = Partial<ImageUploadPreviewPropsWithContext>;

/**
 * UI Component to preview the images set for upload
 */
export const ImageUploadPreview = (props: ImageUploadPreviewProps) => {
  const { ImageAttachmentUploadPreview, VideoAttachmentUploadPreview } = useMessageInputContext();
  return (
    <MemoizedImageUploadPreviewWithContext
      {...{ ImageAttachmentUploadPreview, VideoAttachmentUploadPreview }}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  fileSizeText: {
    fontSize: 12,
    paddingHorizontal: 10,
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

ImageUploadPreview.displayName = 'ImageUploadPreview{messageInput{imageUploadPreview}}';
