import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, LayoutChangeEvent, StyleSheet, View } from 'react-native';

import {
  isAudioAttachment,
  isLocalAudioAttachment,
  isLocalFileAttachment,
  isLocalImageAttachment,
  isLocalVoiceRecordingAttachment,
  isVideoAttachment,
  isVoiceRecordingAttachment,
  LocalAttachment,
  LocalImageAttachment,
} from 'stream-chat';

import { useMessageComposer } from '../../contexts';
import { useAttachmentManagerState } from '../../contexts/messageInputContext/hooks/useAttachmentManagerState';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { isSoundPackageAvailable } from '../../native';
import { AudioConfig } from '../../types/types';

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
  const [audioAttachmentsStateMap, setAudioAttachmentsStateMap] = useState<
    Record<string, AudioConfig>
  >({});
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

  useEffect(() => {
    const newAudioAttachmentsStateMap = fileUploads.reduce(
      (acc, attachment) => {
        if (isAudioAttachment(attachment) || isVoiceRecordingAttachment(attachment)) {
          acc[attachment.localMetadata.id] = {
            duration:
              attachment.duration ||
              audioAttachmentsStateMap[attachment.localMetadata.id]?.duration ||
              0,
            paused: true,
            progress: 0,
          };
        }
        return acc;
      },
      {} as Record<string, AudioConfig>,
    );

    setAudioAttachmentsStateMap(newAudioAttachmentsStateMap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUploads]);

  // Handler triggered when an audio is loaded in the message input. The initial state is defined for the audio here
  // and the duration is set.
  const onLoad = useCallback((index: string, duration: number) => {
    setAudioAttachmentsStateMap((prevState) => ({
      ...prevState,
      [index]: {
        ...prevState[index],
        duration,
      },
    }));
  }, []);

  // The handler which is triggered when the audio progresses/ the thumb is dragged in the progress control. The
  // progressed duration is set here.
  const onProgress = useCallback((index: string, progress: number) => {
    setAudioAttachmentsStateMap((prevState) => ({
      ...prevState,
      [index]: {
        ...prevState[index],
        progress,
      },
    }));
  }, []);

  // The handler which controls or sets the paused/played state of the audio.
  const onPlayPause = useCallback((index: string, pausedStatus?: boolean) => {
    if (pausedStatus === false) {
      // In this case, all others except the index are set to paused.
      setAudioAttachmentsStateMap((prevState) => {
        const newState = { ...prevState };
        Object.keys(newState).forEach((key) => {
          if (key !== index) {
            newState[key].paused = true;
          }
        });
        return {
          ...newState,
          [index]: {
            ...newState[index],
            paused: false,
          },
        };
      });
    } else {
      setAudioAttachmentsStateMap((prevState) => ({
        ...prevState,
        [index]: {
          ...prevState[index],
          paused: true,
        },
      }));
    }
  }, []);

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
