import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import {
  isLocalAudioAttachment,
  isLocalFileAttachment,
  isLocalImageAttachment,
  isLocalVoiceRecordingAttachment,
  isVideoAttachment,
  LocalAttachment,
} from 'stream-chat';

import { useMessageComposer } from '../../../../contexts';
import { useAttachmentManagerState } from '../../../../contexts/messageInputContext/hooks/useAttachmentManagerState';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { isSoundPackageAvailable } from '../../../../native';

const IMAGE_PREVIEW_SIZE = 72;
const FILE_PREVIEW_HEIGHT = 224;

export type AttachmentUploadListPreviewPropsWithContext = Pick<
  MessageInputContextValue,
  | 'AudioAttachmentUploadPreview'
  | 'FileAttachmentUploadPreview'
  | 'ImageAttachmentUploadPreview'
  | 'VideoAttachmentUploadPreview'
>;

const ItemSeparatorComponent = () => {
  const styles = useStyles();
  const {
    theme: {
      messageInput: {
        attachmentUploadPreviewList: { itemSeparator },
      },
    },
  } = useTheme();
  return <View style={[styles.itemSeparator, itemSeparator]} />;
};

const getItemLayout = (data: ArrayLike<LocalAttachment> | null | undefined, index: number) => {
  const item = data?.[index];
  if (item && isLocalImageAttachment(item as LocalAttachment)) {
    return {
      index,
      length: IMAGE_PREVIEW_SIZE + 8,
      offset: (IMAGE_PREVIEW_SIZE + 8) * index,
    };
  }
  return {
    index,
    length: FILE_PREVIEW_HEIGHT + 8,
    offset: (FILE_PREVIEW_HEIGHT + 8) * index,
  };
};

/**
 * AttachmentUploadPreviewList
 * UI Component to preview the files set for upload
 */
const UnMemoizedAttachmentUploadPreviewList = (
  props: AttachmentUploadListPreviewPropsWithContext,
) => {
  const {
    AudioAttachmentUploadPreview,
    FileAttachmentUploadPreview,
    ImageAttachmentUploadPreview,
    VideoAttachmentUploadPreview,
  } = props;
  const { attachmentManager } = useMessageComposer();
  const { attachments } = useAttachmentManagerState();

  const styles = useStyles();
  const {
    theme: {
      messageInput: {
        attachmentUploadPreviewList: { flatList },
      },
    },
  } = useTheme();

  const renderItem = useCallback(
    ({ item }: { item: LocalAttachment }) => {
      if (isLocalImageAttachment(item)) {
        return (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            layout={LinearTransition.duration(200)}
          >
            <ImageAttachmentUploadPreview
              attachment={item}
              handleRetry={attachmentManager.uploadAttachment}
              removeAttachments={attachmentManager.removeAttachments}
            />
          </Animated.View>
        );
      } else if (isLocalVoiceRecordingAttachment(item)) {
        return (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            layout={LinearTransition.duration(200)}
          >
            <AudioAttachmentUploadPreview
              attachment={item}
              handleRetry={attachmentManager.uploadAttachment}
              removeAttachments={attachmentManager.removeAttachments}
            />
          </Animated.View>
        );
      } else if (isLocalAudioAttachment(item)) {
        if (isSoundPackageAvailable()) {
          return (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              layout={LinearTransition.duration(200)}
            >
              <AudioAttachmentUploadPreview
                attachment={item}
                handleRetry={attachmentManager.uploadAttachment}
                removeAttachments={attachmentManager.removeAttachments}
              />
            </Animated.View>
          );
        } else {
          return (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              layout={LinearTransition.duration(200)}
            >
              <FileAttachmentUploadPreview
                attachment={item}
                handleRetry={attachmentManager.uploadAttachment}
                removeAttachments={attachmentManager.removeAttachments}
              />
            </Animated.View>
          );
        }
      } else if (isVideoAttachment(item)) {
        return (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            layout={LinearTransition.duration(200)}
          >
            <VideoAttachmentUploadPreview
              attachment={item}
              handleRetry={attachmentManager.uploadAttachment}
              removeAttachments={attachmentManager.removeAttachments}
            />
          </Animated.View>
        );
      } else if (isLocalFileAttachment(item)) {
        return (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            layout={LinearTransition.duration(200)}
          >
            <FileAttachmentUploadPreview
              attachment={item}
              handleRetry={attachmentManager.uploadAttachment}
              removeAttachments={attachmentManager.removeAttachments}
            />
          </Animated.View>
        );
      } else return null;
    },
    [
      AudioAttachmentUploadPreview,
      FileAttachmentUploadPreview,
      ImageAttachmentUploadPreview,
      VideoAttachmentUploadPreview,
      attachmentManager.removeAttachments,
      attachmentManager.uploadAttachment,
    ],
  );

  if (!attachments.length) {
    return null;
  }

  return (
    <FlatList
      data={attachments}
      getItemLayout={getItemLayout}
      horizontal
      ItemSeparatorComponent={ItemSeparatorComponent}
      keyExtractor={(item) => item.localMetadata.id}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      style={[styles.flatList, flatList]}
      testID={'attachment-upload-preview-list'}
    />
  );
};

export type AttachmentUploadPreviewListProps = Partial<AttachmentUploadListPreviewPropsWithContext>;

const MemoizedAttachmentUploadPreviewListWithContext = React.memo(
  UnMemoizedAttachmentUploadPreviewList,
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

const useStyles = () => {
  const {
    theme: { spacing },
  } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        flatList: {
          overflow: 'visible',
        },
        itemSeparator: {
          width: spacing.xs,
        },
        wrapper: {},
      }),
    [spacing.xs],
  );
};

AttachmentUploadPreviewList.displayName =
  'AttachmentUploadPreviewList{messageInput{attachmentUploadPreviewList}}';
