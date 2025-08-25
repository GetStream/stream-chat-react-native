import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, LayoutChangeEvent, StyleSheet, View } from 'react-native';

import {
  isLocalAudioAttachment,
  isLocalFileAttachment,
  isLocalImageAttachment,
  isLocalVoiceRecordingAttachment,
  isVideoAttachment,
  LocalAttachment,
  LocalImageAttachment,
} from 'stream-chat';

import { useAudioPreviewManager } from './hooks/useAudioPreviewManager';

import { useMessageComposer } from '../../contexts';
import { useAttachmentManagerState } from '../../contexts/messageInputContext/hooks/useAttachmentManagerState';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { isSoundPackageAvailable } from '../../native';

const IMAGE_PREVIEW_SIZE = 100;
const FILE_PREVIEW_HEIGHT = 60;

export type AttachmentUploadPreviewListPropsWithContext = Pick<
  MessageInputContextValue,
  | 'AudioAttachmentUploadPreview'
  | 'FileAttachmentUploadPreview'
  | 'ImageAttachmentUploadPreview'
  | 'VideoAttachmentUploadPreview'
>;

/**
 * AttachmentUploadPreviewList
 * UI Component to preview the files set for upload
 */
const UnMemoizedAttachmentUploadListPreview = (
  props: AttachmentUploadPreviewListPropsWithContext,
) => {
  const [flatListWidth, setFlatListWidth] = useState(0);
  const flatListRef = useRef<FlatList<LocalAttachment> | null>(null);
  const {
    AudioAttachmentUploadPreview,
    FileAttachmentUploadPreview,
    ImageAttachmentUploadPreview,
    VideoAttachmentUploadPreview,
  } = props;
  const { attachmentManager } = useMessageComposer();
  const { attachments } = useAttachmentManagerState();
  const {
    theme: {
      colors: { grey_whisper },
      messageInput: {
        attachmentSeparator,
        attachmentUploadPreviewList: { filesFlatList, imagesFlatList, wrapper },
      },
    },
  } = useTheme();

  const imageUploads = attachments.filter((attachment) => isLocalImageAttachment(attachment));
  const fileUploads = useMemo(() => {
    return attachments.filter((attachment) => !isLocalImageAttachment(attachment));
  }, [attachments]);
  const audioUploads = useMemo(() => {
    return fileUploads.filter(
      (attachment) =>
        isLocalAudioAttachment(attachment) || isLocalVoiceRecordingAttachment(attachment),
    );
  }, [fileUploads]);

  const { audioAttachmentsStateMap, onLoad, onProgress, onPlayPause } =
    useAudioPreviewManager(audioUploads);

  const renderImageItem = useCallback(
    ({ item }: { item: LocalImageAttachment }) => {
      return (
        <ImageAttachmentUploadPreview
          attachment={item}
          handleRetry={attachmentManager.uploadAttachment}
          removeAttachments={attachmentManager.removeAttachments}
        />
      );
    },
    [
      ImageAttachmentUploadPreview,
      attachmentManager.removeAttachments,
      attachmentManager.uploadAttachment,
    ],
  );

  const renderFileItem = useCallback(
    ({ item }: { item: LocalAttachment }) => {
      if (isLocalImageAttachment(item)) {
        // This is already handled in the `renderImageItem` above, so we return null here to avoid duplication.
        return null;
      } else if (isLocalVoiceRecordingAttachment(item)) {
        return (
          <AudioAttachmentUploadPreview
            attachment={item}
            audioAttachmentConfig={audioAttachmentsStateMap[item.localMetadata.id]}
            handleRetry={attachmentManager.uploadAttachment}
            onLoad={onLoad}
            onPlayPause={onPlayPause}
            onProgress={onProgress}
            removeAttachments={attachmentManager.removeAttachments}
          />
        );
      } else if (isLocalAudioAttachment(item)) {
        if (isSoundPackageAvailable()) {
          return (
            <AudioAttachmentUploadPreview
              attachment={item}
              audioAttachmentConfig={audioAttachmentsStateMap[item.localMetadata.id]}
              handleRetry={attachmentManager.uploadAttachment}
              onLoad={onLoad}
              onPlayPause={onPlayPause}
              onProgress={onProgress}
              removeAttachments={attachmentManager.removeAttachments}
            />
          );
        } else {
          return (
            <FileAttachmentUploadPreview
              attachment={item}
              flatListWidth={flatListWidth}
              handleRetry={attachmentManager.uploadAttachment}
              removeAttachments={attachmentManager.removeAttachments}
            />
          );
        }
      } else if (isVideoAttachment(item)) {
        return (
          <VideoAttachmentUploadPreview
            attachment={item}
            flatListWidth={flatListWidth}
            handleRetry={attachmentManager.uploadAttachment}
            removeAttachments={attachmentManager.removeAttachments}
          />
        );
      } else if (isLocalFileAttachment(item)) {
        return (
          <FileAttachmentUploadPreview
            attachment={item}
            flatListWidth={flatListWidth}
            handleRetry={attachmentManager.uploadAttachment}
            removeAttachments={attachmentManager.removeAttachments}
          />
        );
      } else return null;
    },
    [
      AudioAttachmentUploadPreview,
      FileAttachmentUploadPreview,
      VideoAttachmentUploadPreview,
      attachmentManager.removeAttachments,
      attachmentManager.uploadAttachment,
      audioAttachmentsStateMap,
      flatListWidth,
      onLoad,
      onPlayPause,
      onProgress,
    ],
  );

  useEffect(() => {
    if (fileUploads.length && flatListRef.current) {
      setTimeout(() => flatListRef.current?.scrollToEnd(), 1);
    }
  }, [fileUploads.length]);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (flatListRef.current) {
        setFlatListWidth(event.nativeEvent.layout.width);
      }
    },
    [flatListRef],
  );

  if (!attachments.length) {
    return null;
  }

  return (
    <View style={[wrapper]}>
      {imageUploads.length ? (
        <FlatList
          data={imageUploads}
          getItemLayout={(_, index) => ({
            index,
            length: IMAGE_PREVIEW_SIZE + 8,
            offset: (IMAGE_PREVIEW_SIZE + 8) * index,
          })}
          horizontal
          keyExtractor={(item) => item.localMetadata.id}
          renderItem={renderImageItem}
          style={[styles.imagesFlatList, imagesFlatList]}
        />
      ) : null}
      {imageUploads.length && fileUploads.length ? (
        <View
          style={[
            styles.attachmentSeparator,
            {
              borderBottomColor: grey_whisper,
            },
            attachmentSeparator,
          ]}
        />
      ) : null}
      {fileUploads.length ? (
        <FlatList
          data={fileUploads}
          getItemLayout={(_, index) => ({
            index,
            length: FILE_PREVIEW_HEIGHT + 8,
            offset: (FILE_PREVIEW_HEIGHT + 8) * index,
          })}
          keyExtractor={(item) => item.localMetadata.id}
          onLayout={onLayout}
          ref={flatListRef}
          renderItem={renderFileItem}
          style={[styles.filesFlatList, filesFlatList]}
          testID={'file-upload-preview'}
        />
      ) : null}
    </View>
  );
};

export type AttachmentUploadPreviewListProps = Partial<AttachmentUploadPreviewListPropsWithContext>;

const MemoizedAttachmentUploadPreviewListWithContext = React.memo(
  UnMemoizedAttachmentUploadListPreview,
);

/**
 * AttachmentUploadPreviewList
 * UI Component to preview the files set for upload
 */
export const AttachmentUploadPreviewList = (props: AttachmentUploadPreviewListProps) => {
  const {
    AudioAttachmentUploadPreview,
    FileAttachmentUploadPreview,
    ImageAttachmentUploadPreview,
    VideoAttachmentUploadPreview,
  } = useMessageInputContext();
  return (
    <MemoizedAttachmentUploadPreviewListWithContext
      {...{
        AudioAttachmentUploadPreview,
        FileAttachmentUploadPreview,
        ImageAttachmentUploadPreview,
        VideoAttachmentUploadPreview,
      }}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  attachmentSeparator: {
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  filesFlatList: { marginBottom: 12, maxHeight: FILE_PREVIEW_HEIGHT * 2.5 + 16 },
  imagesFlatList: { paddingBottom: 12 },
});

AttachmentUploadPreviewList.displayName =
  'AttachmentUploadPreviewList{messageInput{attachmentUploadPreviewList}}';
