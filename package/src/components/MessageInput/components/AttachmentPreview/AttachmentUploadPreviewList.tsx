import React, { useCallback, useEffect, useRef } from 'react';
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';

import Animated, {
  cancelAnimation,
  ZoomIn,
  ZoomOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

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
import { primitives } from '../../../../theme';

const END_ANCHOR_THRESHOLD = 16;
const END_SHRINK_COMPENSATION_DURATION = 200;

export type AttachmentUploadListPreviewPropsWithContext = Pick<
  MessageInputContextValue,
  | 'AudioAttachmentUploadPreview'
  | 'FileAttachmentUploadPreview'
  | 'ImageAttachmentUploadPreview'
  | 'VideoAttachmentUploadPreview'
>;

const AttachmentPreviewCell = ({ children }: { children: React.ReactNode }) => (
  <Animated.View
    entering={ZoomIn.duration(200)}
    exiting={ZoomOut.duration(200)}
    layout={LinearTransition.duration(200)}
  >
    {children}
  </Animated.View>
);

const ItemSeparatorComponent = () => {
  const {
    theme: {
      messageInput: {
        attachmentUploadPreviewList: { itemSeparator },
      },
    },
  } = useTheme();
  return <View style={[styles.itemSeparator, itemSeparator]} />;
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
  const attachmentListRef = useRef<FlatList<LocalAttachment>>(null);
  const previousAttachmentsLengthRef = useRef(attachments.length);
  const contentWidthRef = useRef(0);
  const viewportWidthRef = useRef(0);
  const scrollOffsetXRef = useRef(0);
  const endShrinkCompensationX = useSharedValue(0);

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
          <AttachmentPreviewCell>
            <ImageAttachmentUploadPreview
              attachment={item}
              handleRetry={attachmentManager.uploadAttachment}
              removeAttachments={attachmentManager.removeAttachments}
            />
          </AttachmentPreviewCell>
        );
      } else if (isLocalVoiceRecordingAttachment(item)) {
        return (
          <AttachmentPreviewCell>
            <AudioAttachmentUploadPreview
              attachment={item}
              handleRetry={attachmentManager.uploadAttachment}
              removeAttachments={attachmentManager.removeAttachments}
            />
          </AttachmentPreviewCell>
        );
      } else if (isLocalAudioAttachment(item)) {
        if (isSoundPackageAvailable()) {
          return (
            <AttachmentPreviewCell>
              <AudioAttachmentUploadPreview
                attachment={item}
                handleRetry={attachmentManager.uploadAttachment}
                removeAttachments={attachmentManager.removeAttachments}
              />
            </AttachmentPreviewCell>
          );
        } else {
          return (
            <AttachmentPreviewCell>
              <FileAttachmentUploadPreview
                attachment={item}
                handleRetry={attachmentManager.uploadAttachment}
                removeAttachments={attachmentManager.removeAttachments}
              />
            </AttachmentPreviewCell>
          );
        }
      } else if (isVideoAttachment(item)) {
        return (
          <AttachmentPreviewCell>
            <VideoAttachmentUploadPreview
              attachment={item}
              handleRetry={attachmentManager.uploadAttachment}
              removeAttachments={attachmentManager.removeAttachments}
            />
          </AttachmentPreviewCell>
        );
      } else if (isLocalFileAttachment(item)) {
        return (
          <AttachmentPreviewCell>
            <FileAttachmentUploadPreview
              attachment={item}
              handleRetry={attachmentManager.uploadAttachment}
              removeAttachments={attachmentManager.removeAttachments}
            />
          </AttachmentPreviewCell>
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

  const onScrollHandler = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetXRef.current = event.nativeEvent.contentOffset.x;
  }, []);

  const onLayoutHandler = useCallback((event: LayoutChangeEvent) => {
    viewportWidthRef.current = event.nativeEvent.layout.width;
  }, []);

  const onContentSizeChangeHandler = useCallback(
    (width: number) => {
      const previousContentWidth = contentWidthRef.current;
      contentWidthRef.current = width;

      if (!previousContentWidth || width >= previousContentWidth) {
        return;
      }

      const oldMaxOffset = Math.max(0, previousContentWidth - viewportWidthRef.current);
      const newMaxOffset = Math.max(0, width - viewportWidthRef.current);
      const offsetBefore = scrollOffsetXRef.current;
      const wasNearEnd = oldMaxOffset - offsetBefore <= END_ANCHOR_THRESHOLD;
      const overshoot = Math.max(0, offsetBefore - newMaxOffset);
      const shouldAnchorEnd = wasNearEnd || overshoot > 0;

      if (!shouldAnchorEnd) {
        return;
      }

      if (overshoot > 0) {
        attachmentListRef.current?.scrollToOffset({
          animated: false,
          offset: newMaxOffset,
        });
        scrollOffsetXRef.current = newMaxOffset;
      }

      const compensation = newMaxOffset - oldMaxOffset;
      if (compensation !== 0) {
        cancelAnimation(endShrinkCompensationX);
        endShrinkCompensationX.value = compensation;
        endShrinkCompensationX.value = withSpring(0, {
          duration: END_SHRINK_COMPENSATION_DURATION,
        });
      }
    },
    [endShrinkCompensationX],
  );

  useEffect(() => {
    const previousLength = previousAttachmentsLengthRef.current;
    const nextLength = attachments.length;
    const didAddAttachment = nextLength > previousLength;
    previousAttachmentsLengthRef.current = nextLength;

    if (!didAddAttachment) {
      return;
    }

    cancelAnimation(endShrinkCompensationX);
    endShrinkCompensationX.value = 0;
    requestAnimationFrame(() => {
      attachmentListRef.current?.scrollToEnd({ animated: true });
    });
  }, [attachments.length, endShrinkCompensationX]);

  const animatedListWrapperStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: endShrinkCompensationX.value }],
  }));

  if (!attachments.length) {
    return null;
  }

  return (
    <Animated.View style={animatedListWrapperStyle}>
      <FlatList
        data={attachments}
        horizontal
        ItemSeparatorComponent={ItemSeparatorComponent}
        keyExtractor={(item) => item.localMetadata.id}
        onContentSizeChange={onContentSizeChangeHandler}
        onLayout={onLayoutHandler}
        onScroll={onScrollHandler}
        removeClippedSubviews={false}
        ref={attachmentListRef}
        renderItem={renderItem}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        style={[styles.flatList, flatList]}
        testID={'attachment-upload-preview-list'}
      />
    </Animated.View>
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

const styles = StyleSheet.create({
  flatList: {
    overflow: 'visible',
  },
  itemSeparator: {
    width: primitives.spacingXs,
  },
});

AttachmentUploadPreviewList.displayName =
  'AttachmentUploadPreviewList{messageInput{attachmentUploadPreviewList}}';
