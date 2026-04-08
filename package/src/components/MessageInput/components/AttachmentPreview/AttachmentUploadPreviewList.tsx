import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  I18nManager,
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
  LocalAudioAttachment,
  LocalVoiceRecordingAttachment,
} from 'stream-chat';

import { useMessageComposer } from '../../../../contexts';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useAttachmentManagerState } from '../../../../contexts/messageInputContext/hooks/useAttachmentManagerState';
import { useMessageInputContext } from '../../../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { isSoundPackageAvailable } from '../../../../native';
import { primitives } from '../../../../theme';

const END_ANCHOR_THRESHOLD = 16;
const END_SHRINK_COMPENSATION_DURATION = 200;
const MAX_AUDIO_ATTACHMENTS_CONTAINER_WIDTH = 560;

export type AttachmentUploadListPreviewPropsWithContext = Record<string, never>;

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
      messageComposer: {
        attachmentUploadPreviewList: { itemSeparator },
      },
    },
  } = useTheme();
  return <View style={[styles.itemSeparator, itemSeparator]} />;
};

const getIsAudioAttachmentPreview =
  (soundPackageAvailable: boolean) =>
  (
    attachment: LocalAttachment,
  ): attachment is LocalAudioAttachment | LocalVoiceRecordingAttachment =>
    isLocalVoiceRecordingAttachment(attachment) ||
    (soundPackageAvailable && isLocalAudioAttachment(attachment));

/**
 * AttachmentUploadPreviewList
 * UI Component to preview the files set for upload
 */
const UnMemoizedAttachmentUploadPreviewList = () => {
  const {
    AudioAttachmentUploadPreview,
    FileAttachmentUploadPreview,
    ImageAttachmentUploadPreview,
    VideoAttachmentUploadPreview,
  } = useComponentsContext();
  const { audioRecordingSendOnComplete } = useMessageInputContext();
  const { attachmentManager } = useMessageComposer();
  const { attachments } = useAttachmentManagerState();
  const isRTL = I18nManager.isRTL;
  const attachmentListRef = useRef<FlatList<LocalAttachment>>(null);
  const soundPackageAvailable = isSoundPackageAvailable();
  const isAudioAttachmentPreview = getIsAudioAttachmentPreview(soundPackageAvailable);
  const previousNonAudioAttachmentsLengthRef = useRef(0);
  const contentWidthRef = useRef(0);
  const itemsContentWidthRef = useRef(0);
  const viewportWidthRef = useRef(0);
  const scrollOffsetXRef = useRef(0);
  const rtlLeadingSpacerWidthRef = useRef(0);
  const endShrinkCompensationX = useSharedValue(0);
  const [rtlLeadingSpacerWidth, setRtlLeadingSpacerWidth] = useState(0);
  const previewAttachments = attachments.filter(
    (attachment) => !(audioRecordingSendOnComplete && isLocalVoiceRecordingAttachment(attachment)),
  );
  const audioAttachments = previewAttachments.filter(isAudioAttachmentPreview);
  const nonAudioAttachments = previewAttachments.filter(
    (attachment) => !isAudioAttachmentPreview(attachment),
  );
  const data = isRTL ? nonAudioAttachments.toReversed() : nonAudioAttachments;

  const {
    theme: {
      messageComposer: {
        attachmentUploadPreviewList: { audioAttachmentsContainer, flatList },
      },
    },
  } = useTheme();

  const updateRtlLeadingSpacerWidth = useCallback(
    (itemsWidth: number, viewportWidth: number) => {
      if (!isRTL || !viewportWidth) {
        if (rtlLeadingSpacerWidthRef.current !== 0) {
          rtlLeadingSpacerWidthRef.current = 0;
          setRtlLeadingSpacerWidth(0);
        }
        return;
      }

      const nextSpacerWidth = Math.max(0, viewportWidth - itemsWidth);
      if (rtlLeadingSpacerWidthRef.current === nextSpacerWidth) {
        return;
      }

      rtlLeadingSpacerWidthRef.current = nextSpacerWidth;
      setRtlLeadingSpacerWidth(nextSpacerWidth);
    },
    [isRTL],
  );

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

  const onLayoutHandler = useCallback(
    (event: LayoutChangeEvent) => {
      const viewportWidth = event.nativeEvent.layout.width;
      viewportWidthRef.current = viewportWidth;
      updateRtlLeadingSpacerWidth(itemsContentWidthRef.current, viewportWidth);
    },
    [updateRtlLeadingSpacerWidth],
  );

  const onContentSizeChangeHandler = useCallback(
    (width: number) => {
      const itemsContentWidth = isRTL
        ? Math.max(0, width - rtlLeadingSpacerWidthRef.current)
        : width;
      const previousContentWidth = contentWidthRef.current;
      contentWidthRef.current = itemsContentWidth;
      itemsContentWidthRef.current = itemsContentWidth;
      updateRtlLeadingSpacerWidth(itemsContentWidth, viewportWidthRef.current);

      if (!previousContentWidth || itemsContentWidth >= previousContentWidth) {
        return;
      }

      const oldMaxOffset = Math.max(0, previousContentWidth - viewportWidthRef.current);
      const newMaxOffset = Math.max(0, itemsContentWidth - viewportWidthRef.current);
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

      if (isRTL) {
        return;
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
    [endShrinkCompensationX, isRTL, updateRtlLeadingSpacerWidth],
  );

  useEffect(() => {
    const previousLength = previousNonAudioAttachmentsLengthRef.current;
    const nextLength = nonAudioAttachments.length;
    const didAddAttachment = nextLength > previousLength;
    previousNonAudioAttachmentsLengthRef.current = nextLength;

    if (!didAddAttachment) {
      return;
    }

    cancelAnimation(endShrinkCompensationX);
    endShrinkCompensationX.value = 0;
    requestAnimationFrame(() => {
      if (isRTL) {
        return;
      }

      attachmentListRef.current?.scrollToEnd({ animated: true });
    });
  }, [endShrinkCompensationX, isRTL, nonAudioAttachments.length]);

  const animatedListWrapperStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: endShrinkCompensationX.value }],
  }));

  if (!previewAttachments.length) {
    return null;
  }

  return (
    <>
      {audioAttachments.length ? (
        <Animated.View
          entering={ZoomIn.duration(200)}
          exiting={ZoomOut.duration(200)}
          layout={LinearTransition.duration(200)}
          style={[styles.audioAttachmentsContainer, audioAttachmentsContainer]}
        >
          {audioAttachments.map((attachment) => (
            <AttachmentPreviewCell key={attachment.localMetadata.id}>
              <AudioAttachmentUploadPreview
                attachment={attachment}
                handleRetry={attachmentManager.uploadAttachment}
                removeAttachments={attachmentManager.removeAttachments}
              />
            </AttachmentPreviewCell>
          ))}
        </Animated.View>
      ) : null}

      {data.length ? (
        <Animated.View
          entering={ZoomIn.duration(200)}
          exiting={ZoomOut.duration(200)}
          layout={LinearTransition.duration(200)}
        >
          <Animated.View style={animatedListWrapperStyle}>
            <FlatList
              data={data}
              horizontal
              ItemSeparatorComponent={ItemSeparatorComponent}
              keyExtractor={(item) => item.localMetadata.id}
              ListHeaderComponent={
                isRTL && rtlLeadingSpacerWidth > 0 ? (
                  <View style={{ width: rtlLeadingSpacerWidth }} />
                ) : null
              }
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
        </Animated.View>
      ) : null}
    </>
  );
};

export type AttachmentUploadPreviewListProps = Record<string, never>;

const MemoizedAttachmentUploadPreviewListWithContext = React.memo(
  UnMemoizedAttachmentUploadPreviewList,
);

/**
 * AttachmentUploadPreviewList
 * UI Component to preview the files set for upload
 */
export const AttachmentUploadPreviewList = () => <MemoizedAttachmentUploadPreviewListWithContext />;

const styles = StyleSheet.create({
  audioAttachmentsContainer: {
    maxWidth: MAX_AUDIO_ATTACHMENTS_CONTAINER_WIDTH,
    width: '100%',
  },
  flatList: {
    overflow: 'visible',
    direction: 'ltr',
  },
  itemSeparator: {
    width: primitives.spacingXs,
  },
});

AttachmentUploadPreviewList.displayName =
  'AttachmentUploadPreviewList{messageComposer{attachmentUploadPreviewList}}';
