import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  I18nManager,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import Animated, { LinearTransition, ZoomIn, ZoomOut } from 'react-native-reanimated';

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
const ATTACHMENT_PREVIEW_ANIMATION_DURATION = 200;
const TRAILING_SPACER_RELEASE_DELAY = ATTACHMENT_PREVIEW_ANIMATION_DURATION + 80;
const MAX_AUDIO_ATTACHMENTS_CONTAINER_WIDTH = 560;
const attachmentPreviewEntering = ZoomIn.duration(ATTACHMENT_PREVIEW_ANIMATION_DURATION);
const attachmentPreviewExiting = ZoomOut.duration(ATTACHMENT_PREVIEW_ANIMATION_DURATION);
const attachmentPreviewLayout = LinearTransition.duration(ATTACHMENT_PREVIEW_ANIMATION_DURATION);

export type AttachmentUploadListPreviewPropsWithContext = Record<string, never>;

const AttachmentPreviewCell = ({
  children,
  onLayout,
  style,
}: {
  children: React.ReactNode;
  onLayout?: (event: LayoutChangeEvent) => void;
  style?: StyleProp<ViewStyle>;
}) => (
  <Animated.View
    entering={attachmentPreviewEntering}
    exiting={attachmentPreviewExiting}
    layout={attachmentPreviewLayout}
    onLayout={onLayout}
    style={style}
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

const useLazyRef = <T,>(getInitialValue: () => T) => {
  const ref = useRef<T | null>(null);

  if (ref.current === null) {
    ref.current = getInitialValue();
  }

  return ref as React.RefObject<T>;
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
  const attachmentListRef = useRef<ScrollView>(null);
  const soundPackageAvailable = useMemo(() => isSoundPackageAvailable(), []);
  const isAudioAttachmentPreview = useMemo(
    () => getIsAudioAttachmentPreview(soundPackageAvailable),
    [soundPackageAvailable],
  );
  const dataRef = useLazyRef<LocalAttachment[]>(() => []);
  const previousDataRef = useLazyRef<LocalAttachment[]>(() => []);
  const previousNonAudioAttachmentsLengthRef = useRef(0);
  const contentWidthRef = useRef(0);
  const itemsContentWidthRef = useRef(0);
  const viewportWidthRef = useRef(0);
  const scrollOffsetXRef = useRef(0);
  const attachmentCellWidthsRef = useLazyRef<Record<string, number>>(() => ({}));
  const preparedRemovalIdsRef = useLazyRef<Set<string>>(() => new Set());
  const spacerReleaseFramesRef = useLazyRef<Set<number>>(() => new Set());
  const spacerReleaseTimeoutsRef = useLazyRef<Set<ReturnType<typeof setTimeout>>>(() => new Set());
  const shouldScrollToEndOnContentSizeChangeRef = useRef(false);
  const trailingSpacerWidthRef = useRef(0);
  const [trailingSpacerWidth, setTrailingSpacerWidth] = useState(0);
  const previewAttachments = useMemo(
    () =>
      attachments.filter(
        (attachment) =>
          !(audioRecordingSendOnComplete && isLocalVoiceRecordingAttachment(attachment)),
      ),
    [attachments, audioRecordingSendOnComplete],
  );
  const audioAttachments = useMemo(
    () => previewAttachments.filter(isAudioAttachmentPreview),
    [isAudioAttachmentPreview, previewAttachments],
  );
  const nonAudioAttachments = useMemo(
    () => previewAttachments.filter((attachment) => !isAudioAttachmentPreview(attachment)),
    [isAudioAttachmentPreview, previewAttachments],
  );
  const data = useMemo(
    () => (isRTL ? nonAudioAttachments.toReversed() : nonAudioAttachments),
    [isRTL, nonAudioAttachments],
  );

  const {
    theme: {
      messageComposer: {
        attachmentUploadPreviewList: { audioAttachmentsContainer, flatList },
      },
    },
  } = useTheme();

  const scrollToOffset = useCallback((offset: number, animated = false) => {
    const nextOffset = Math.max(0, offset);

    attachmentListRef.current?.scrollTo({
      animated,
      x: nextOffset,
    });
    scrollOffsetXRef.current = nextOffset;
  }, []);

  const setTrailingSpacerLayoutWidth = useCallback((width: number) => {
    const nextWidth = Math.max(0, width);
    trailingSpacerWidthRef.current = nextWidth;
    setTrailingSpacerWidth(nextWidth);
  }, []);

  const prepareTrailingSpacer = useCallback(
    (width: number) => {
      if (width <= 0) {
        return;
      }

      const nextWidth = trailingSpacerWidthRef.current + width;
      setTrailingSpacerLayoutWidth(nextWidth);
    },
    [setTrailingSpacerLayoutWidth],
  );

  const scheduleTrailingSpacerRelease = useCallback(
    (width: number) => {
      if (width <= 0) {
        return;
      }

      const timeout = setTimeout(() => {
        spacerReleaseTimeoutsRef.current.delete(timeout);

        const firstFrame = requestAnimationFrame(() => {
          spacerReleaseFramesRef.current.delete(firstFrame);

          const secondFrame = requestAnimationFrame(() => {
            spacerReleaseFramesRef.current.delete(secondFrame);
            setTrailingSpacerLayoutWidth(trailingSpacerWidthRef.current - width);
          });

          spacerReleaseFramesRef.current.add(secondFrame);
        });

        spacerReleaseFramesRef.current.add(firstFrame);
      }, TRAILING_SPACER_RELEASE_DELAY);

      spacerReleaseTimeoutsRef.current.add(timeout);
    },
    [setTrailingSpacerLayoutWidth, spacerReleaseFramesRef, spacerReleaseTimeoutsRef],
  );

  const getRemovalMetrics = useCallback(
    (ids: string[], baseData: LocalAttachment[]) => {
      const removedIds = new Set(ids);
      const fallbackCellWidth = baseData.length
        ? itemsContentWidthRef.current / baseData.length
        : 0;
      const offsetBefore = scrollOffsetXRef.current;
      const oldMaxOffset = Math.max(0, itemsContentWidthRef.current - viewportWidthRef.current);
      const wasNearEnd = oldMaxOffset - offsetBefore <= END_ANCHOR_THRESHOLD;
      let contentOffset = 0;
      let removedContentWidth = 0;
      let anchorCorrectionWidth = 0;

      baseData.forEach((attachment) => {
        const attachmentId = attachment.localMetadata.id;
        const cellWidth = attachmentCellWidthsRef.current[attachmentId] ?? fallbackCellWidth;

        if (removedIds.has(attachmentId)) {
          removedContentWidth += cellWidth;
          if (contentOffset <= offsetBefore) {
            anchorCorrectionWidth += cellWidth;
          }
        }

        contentOffset += cellWidth;
      });

      if (!removedContentWidth) {
        return {
          removedContentWidth: 0,
          scrollCorrectionWidth: 0,
        };
      }

      return {
        removedContentWidth,
        scrollCorrectionWidth: wasNearEnd
          ? removedContentWidth
          : Math.min(anchorCorrectionWidth, removedContentWidth),
      };
    },
    [attachmentCellWidthsRef],
  );

  const applyRemovalScrollCorrection = useCallback(
    (removedContentWidth: number, scrollCorrectionWidth: number) => {
      if (removedContentWidth <= 0 || isRTL) {
        return;
      }

      const offsetBefore = scrollOffsetXRef.current;
      const nextContentWidth = Math.max(0, itemsContentWidthRef.current - removedContentWidth);
      const nextMaxOffset = Math.max(0, nextContentWidth - viewportWidthRef.current);
      const nextOffset = Math.min(nextMaxOffset, Math.max(0, offsetBefore - scrollCorrectionWidth));

      if (nextOffset !== offsetBefore) {
        scrollToOffset(nextOffset, true);
      }
    },
    [isRTL, scrollToOffset],
  );

  const prepareForRemoval = useCallback(
    (ids: string[], baseData: LocalAttachment[]) => {
      const { removedContentWidth, scrollCorrectionWidth } = getRemovalMetrics(ids, baseData);

      if (!removedContentWidth) {
        return;
      }

      if (!isRTL) {
        prepareTrailingSpacer(removedContentWidth);
      }
      applyRemovalScrollCorrection(removedContentWidth, scrollCorrectionWidth);
      ids.forEach((id) => preparedRemovalIdsRef.current.add(id));
    },
    [
      applyRemovalScrollCorrection,
      getRemovalMetrics,
      isRTL,
      preparedRemovalIdsRef,
      prepareTrailingSpacer,
    ],
  );

  const removeAttachments = useCallback(
    (ids: string[]) => {
      prepareForRemoval(ids, dataRef.current);
      attachmentManager.removeAttachments(ids);
    },
    [attachmentManager, dataRef, prepareForRemoval],
  );

  useLayoutEffect(() => {
    const previousData = previousDataRef.current;
    const nextIds = new Set(data.map((attachment) => attachment.localMetadata.id));
    const removedIds = previousData
      .map((attachment) => attachment.localMetadata.id)
      .filter((id) => !nextIds.has(id));

    if (removedIds.length) {
      const { removedContentWidth } = getRemovalMetrics(removedIds, previousData);
      const unpreparedRemovedIds = removedIds.filter(
        (id) => !preparedRemovalIdsRef.current.has(id),
      );

      const didPrepareAfterRemovalCommit = unpreparedRemovedIds.length > 0;

      if (didPrepareAfterRemovalCommit) {
        prepareForRemoval(unpreparedRemovedIds, previousData);
      }

      removedIds.forEach((id) => preparedRemovalIdsRef.current.delete(id));
      if (!isRTL) {
        scheduleTrailingSpacerRelease(removedContentWidth);
      }
    }

    previousDataRef.current = data;
    dataRef.current = data;
  }, [
    data,
    dataRef,
    getRemovalMetrics,
    isRTL,
    preparedRemovalIdsRef,
    prepareForRemoval,
    previousDataRef,
    scheduleTrailingSpacerRelease,
  ]);

  useEffect(
    () => () => {
      spacerReleaseFramesRef.current.forEach(cancelAnimationFrame);
      spacerReleaseFramesRef.current.clear();
      spacerReleaseTimeoutsRef.current.forEach(clearTimeout);
      spacerReleaseTimeoutsRef.current.clear();
    },
    [spacerReleaseFramesRef, spacerReleaseTimeoutsRef],
  );

  const renderAttachmentPreview = useCallback(
    (attachment: LocalAttachment) => {
      if (isLocalImageAttachment(attachment)) {
        return (
          <ImageAttachmentUploadPreview
            attachment={attachment}
            handleRetry={attachmentManager.uploadAttachment}
            removeAttachments={removeAttachments}
          />
        );
      } else if (isLocalVoiceRecordingAttachment(attachment)) {
        return (
          <AudioAttachmentUploadPreview
            attachment={attachment}
            handleRetry={attachmentManager.uploadAttachment}
            removeAttachments={removeAttachments}
          />
        );
      } else if (isLocalAudioAttachment(attachment)) {
        if (soundPackageAvailable) {
          return (
            <AudioAttachmentUploadPreview
              attachment={attachment}
              handleRetry={attachmentManager.uploadAttachment}
              removeAttachments={removeAttachments}
            />
          );
        } else {
          return (
            <FileAttachmentUploadPreview
              attachment={attachment}
              handleRetry={attachmentManager.uploadAttachment}
              removeAttachments={removeAttachments}
            />
          );
        }
      } else if (isVideoAttachment(attachment)) {
        return (
          <VideoAttachmentUploadPreview
            attachment={attachment}
            handleRetry={attachmentManager.uploadAttachment}
            removeAttachments={removeAttachments}
          />
        );
      } else if (isLocalFileAttachment(attachment)) {
        return (
          <FileAttachmentUploadPreview
            attachment={attachment}
            handleRetry={attachmentManager.uploadAttachment}
            removeAttachments={removeAttachments}
          />
        );
      } else return null;
    },
    [
      AudioAttachmentUploadPreview,
      FileAttachmentUploadPreview,
      ImageAttachmentUploadPreview,
      VideoAttachmentUploadPreview,
      attachmentManager.uploadAttachment,
      removeAttachments,
      soundPackageAvailable,
    ],
  );

  const onScrollHandler = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetXRef.current = event.nativeEvent.contentOffset.x;
  }, []);

  const scrollToEndOffset = useCallback(
    (contentWidth: number, animated = true) => {
      if (isRTL) {
        return;
      }

      scrollToOffset(Math.max(0, contentWidth - viewportWidthRef.current), animated);
    },
    [isRTL, scrollToOffset],
  );

  const onLayoutHandler = useCallback((event: LayoutChangeEvent) => {
    viewportWidthRef.current = event.nativeEvent.layout.width;
  }, []);

  const onAttachmentCellLayout = useCallback(
    (id: string, event: LayoutChangeEvent) => {
      attachmentCellWidthsRef.current[id] = event.nativeEvent.layout.width;
    },
    [attachmentCellWidthsRef],
  );

  const onContentSizeChangeHandler = useCallback(
    (width: number) => {
      const scrollableContentWidth = width;
      const itemsContentWidth = Math.max(
        0,
        scrollableContentWidth - trailingSpacerWidthRef.current,
      );
      const previousContentWidth = contentWidthRef.current;
      contentWidthRef.current = itemsContentWidth;
      itemsContentWidthRef.current = itemsContentWidth;

      if (
        shouldScrollToEndOnContentSizeChangeRef.current &&
        itemsContentWidth > previousContentWidth
      ) {
        shouldScrollToEndOnContentSizeChangeRef.current = false;
        scrollToEndOffset(scrollableContentWidth);
        return;
      }

      if (!previousContentWidth || itemsContentWidth >= previousContentWidth) {
        return;
      }

      const actualMaxOffset = Math.max(0, scrollableContentWidth - viewportWidthRef.current);
      const offsetBefore = scrollOffsetXRef.current;
      const overshoot = Math.max(0, offsetBefore - actualMaxOffset);

      if (overshoot > END_ANCHOR_THRESHOLD) {
        scrollToOffset(actualMaxOffset);
      }
    },
    [scrollToEndOffset, scrollToOffset],
  );

  useEffect(() => {
    const previousLength = previousNonAudioAttachmentsLengthRef.current;
    const nextLength = nonAudioAttachments.length;
    const didAddAttachment = nextLength > previousLength;
    previousNonAudioAttachmentsLengthRef.current = nextLength;

    if (!didAddAttachment) {
      return;
    }

    shouldScrollToEndOnContentSizeChangeRef.current = true;
  }, [nonAudioAttachments.length]);

  if (!previewAttachments.length) {
    return null;
  }

  return (
    <>
      {audioAttachments.length ? (
        <Animated.View
          entering={attachmentPreviewEntering}
          exiting={attachmentPreviewExiting}
          layout={attachmentPreviewLayout}
          style={[styles.audioAttachmentsContainer, audioAttachmentsContainer]}
        >
          {audioAttachments.map((attachment) => (
            <AttachmentPreviewCell key={attachment.localMetadata.id}>
              <AudioAttachmentUploadPreview
                attachment={attachment}
                handleRetry={attachmentManager.uploadAttachment}
                removeAttachments={removeAttachments}
              />
            </AttachmentPreviewCell>
          ))}
        </Animated.View>
      ) : null}

      {data.length ? (
        <Animated.View
          entering={attachmentPreviewEntering}
          exiting={attachmentPreviewExiting}
          layout={attachmentPreviewLayout}
          style={styles.flatListContainer}
        >
          <ScrollView
            contentContainerStyle={styles.flatListContentContainer}
            horizontal
            onContentSizeChange={onContentSizeChangeHandler}
            onLayout={onLayoutHandler}
            onScroll={onScrollHandler}
            ref={attachmentListRef}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            style={[styles.flatList, flatList]}
            testID={'attachment-upload-preview-list'}
          >
            {data.map((attachment, index) => {
              const attachmentId = attachment.localMetadata.id;

              return (
                <AttachmentPreviewCell
                  key={attachmentId}
                  onLayout={(event) => onAttachmentCellLayout(attachmentId, event)}
                  style={styles.attachmentPreviewCell}
                >
                  {index > 0 ? <ItemSeparatorComponent /> : null}
                  <View collapsable={false} style={styles.attachmentPreviewContent}>
                    {renderAttachmentPreview(attachment)}
                  </View>
                </AttachmentPreviewCell>
              );
            })}
            {!isRTL ? (
              <View
                pointerEvents={'none'}
                style={[styles.trailingSpacer, { width: trailingSpacerWidth }]}
              />
            ) : null}
          </ScrollView>
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
  attachmentPreviewCell: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexShrink: 0,
  },
  attachmentPreviewContent: {
    flexShrink: 0,
  },
  audioAttachmentsContainer: {
    maxWidth: MAX_AUDIO_ATTACHMENTS_CONTAINER_WIDTH,
    width: '100%',
  },
  flatList: {
    direction: 'ltr',
    flexGrow: 0,
    overflow: 'visible',
  },
  flatListContentContainer: {
    alignItems: 'flex-start',
  },
  flatListContainer: {
    alignSelf: 'flex-start',
    flexShrink: 1,
    maxWidth: '100%',
  },
  itemSeparator: {
    width: primitives.spacingXs,
  },
  trailingSpacer: {
    flexShrink: 0,
  },
});

AttachmentUploadPreviewList.displayName =
  'AttachmentUploadPreviewList{messageComposer{attachmentUploadPreviewList}}';
