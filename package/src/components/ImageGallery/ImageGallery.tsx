import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, ImageStyle, Keyboard, StyleSheet, ViewStyle } from 'react-native';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import Animated, {
  Easing,
  runOnJS,
  runOnUI,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { BottomSheetModal as BottomSheetModalOriginal } from '@gorhom/bottom-sheet';
import type { UserResponse } from 'stream-chat';

import { AnimatedGalleryImage } from './components/AnimatedGalleryImage';
import { AnimatedGalleryVideo } from './components/AnimatedGalleryVideo';
import {
  ImageGalleryFooter,
  ImageGalleryFooterCustomComponentProps,
} from './components/ImageGalleryFooter';
import {
  ImageGalleryHeader,
  ImageGalleryHeaderCustomComponentProps,
} from './components/ImageGalleryHeader';
import { ImageGalleryOverlay } from './components/ImageGalleryOverlay';
import { ImageGalleryGridImageComponents, ImageGrid } from './components/ImageGrid';
import {
  ImageGalleryGridHandleCustomComponentProps,
  ImageGridHandle,
} from './components/ImageGridHandle';

import { useImageGalleryGestures } from './hooks/useImageGalleryGestures';

import { useChatConfigContext } from '../../contexts/chatConfigContext/ChatConfigContext';
import { useImageGalleryContext } from '../../contexts/imageGalleryContext/ImageGalleryContext';
import { OverlayProviderProps } from '../../contexts/overlayContext/OverlayContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useViewport } from '../../hooks/useViewport';
import { isVideoPlayerAvailable, VideoType } from '../../native';
import { FileTypes } from '../../types/types';
import { getResizedImageUrl } from '../../utils/getResizedImageUrl';
import { getUrlOfImageAttachment } from '../../utils/getUrlOfImageAttachment';
import { getGiphyMimeType } from '../Attachment/utils/getGiphyMimeType';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from '../BottomSheetCompatibility/BottomSheetModal';

const MARGIN = 32;

export enum HasPinched {
  FALSE = 0,
  TRUE,
}

export enum IsSwiping {
  UNDETERMINED = 0,
  TRUE,
  FALSE,
}

export type ImageGalleryCustomComponents = {
  /**
   * Override props for following UI components, which are part of [image gallery](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-v3.0#gallery-components).
   *
   * - [ImageGalleryFooter](#ImageGalleryFooter)
   *
   * - [ImageGrid](#ImageGrid)
   *
   * - [ImageGridHandle](#ImageGridHandle)
   *
   * - [ImageGalleryHeader](#ImageGalleryHeader)
   *
   * e.g.,
   *
   * ```js
   * {
   *  footer: {
   *    ShareIcon: CustomShareIconComponent
   *  },
   *  grid: {
   *    avatarComponent: CustomAvatarComponent
   *  },
   *  gridHandle: {
   *    centerComponent: CustomCenterComponent
   *  },
   *  header: {
   *    CloseIcon: CustomCloseButtonComponent
   *  },
   * }
   * ```
   * @overrideType object
   */
  imageGalleryCustomComponents?: {
    footer?: ImageGalleryFooterCustomComponentProps;
    grid?: ImageGalleryGridImageComponents;
    gridHandle?: ImageGalleryGridHandleCustomComponentProps;
    header?: ImageGalleryHeaderCustomComponentProps;
  };
};

type Props = ImageGalleryCustomComponents & {
  overlayOpacity: SharedValue<number>;
} & Pick<
    OverlayProviderProps,
    | 'giphyVersion'
    | 'imageGalleryGridSnapPoints'
    | 'imageGalleryGridHandleHeight'
    | 'numberOfImageGalleryGridColumns'
    | 'autoPlayVideo'
  >;

export const ImageGallery = (props: Props) => {
  const {
    autoPlayVideo = false,
    giphyVersion = 'fixed_height',
    imageGalleryCustomComponents,
    imageGalleryGridHandleHeight = 40,
    imageGalleryGridSnapPoints,
    numberOfImageGalleryGridColumns,
    overlayOpacity,
  } = props;
  const { resizableCDNHosts } = useChatConfigContext();
  const {
    theme: {
      colors: { white_snow },
      imageGallery: { backgroundColor, pager, slide },
    },
  } = useTheme();
  const [gridPhotos, setGridPhotos] = useState<Photo[]>([]);
  const { messages, selectedMessage, setSelectedMessage } = useImageGalleryContext();

  const { vh, vw } = useViewport();

  const fullWindowHeight = vh(100);
  const fullWindowWidth = vw(100);
  const halfScreenWidth = fullWindowWidth / 2;

  const halfScreenHeight = fullWindowHeight / 2;
  const quarterScreenHeight = fullWindowHeight / 4;
  const snapPoints = React.useMemo(
    () => [(fullWindowHeight * 3) / 4, fullWindowHeight - imageGalleryGridHandleHeight],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /**
   * BottomSheetModal ref
   */
  const bottomSheetModalRef = useRef<BottomSheetModalOriginal>(null);

  /**
   * BottomSheetModal state
   */
  const [currentBottomSheetIndex, setCurrentBottomSheetIndex] = useState(0);
  const animatedBottomSheetIndex = useSharedValue(0);

  /**
   * Fade animation for screen, it is always rendered with pointerEvents
   * set to none for fast opening
   */
  const screenTranslateY = useSharedValue(fullWindowHeight);
  const showScreen = () => {
    'worklet';
    screenTranslateY.value = withTiming(0, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
  };

  /**
   * Run the fade animation on visible change
   */
  useEffect(() => {
    Keyboard.dismiss();
    showScreen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Image height from URL or default to full screen height
   */
  const [currentImageHeight, setCurrentImageHeight] = useState<number>(fullWindowHeight);

  /**
   * Header visible value for animating in out
   */
  const headerFooterVisible = useSharedValue(1);

  /**
   * Shared values for movement
   */
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const offsetScale = useSharedValue(1);
  const scale = useSharedValue(1);
  const translationX = useSharedValue(0);

  /**
   * Photos array created from all currently available
   * photo attachments
   */

  const photos = useMemo(
    () =>
      messages.reduce((acc: Photo[], cur) => {
        const attachmentImages =
          cur.attachments
            ?.filter(
              (attachment) =>
                (attachment.type === FileTypes.Giphy &&
                  (attachment.giphy?.[giphyVersion]?.url ||
                    attachment.thumb_url ||
                    attachment.image_url)) ||
                (attachment.type === FileTypes.Image &&
                  !attachment.title_link &&
                  !attachment.og_scrape_url &&
                  getUrlOfImageAttachment(attachment)) ||
                (isVideoPlayerAvailable() && attachment.type === FileTypes.Video),
            )
            .reverse() || [];

        const attachmentPhotos = attachmentImages.map((a) => {
          const imageUrl = getUrlOfImageAttachment(a) as string;
          const giphyURL = a.giphy?.[giphyVersion]?.url || a.thumb_url || a.image_url;
          const isInitiallyPaused = !autoPlayVideo;

          return {
            channelId: cur.cid,
            created_at: cur.created_at,
            duration: 0,
            id: `photoId-${cur.id}-${imageUrl}`,
            messageId: cur.id,
            mime_type: a.type === 'giphy' ? getGiphyMimeType(giphyURL ?? '') : a.mime_type,
            original_height: a.original_height,
            original_width: a.original_width,
            paused: isInitiallyPaused,
            progress: 0,
            thumb_url: a.thumb_url,
            type: a.type,
            uri:
              a.type === 'giphy'
                ? giphyURL
                : getResizedImageUrl({
                    height: fullWindowHeight,
                    resizableCDNHosts,
                    url: imageUrl,
                    width: fullWindowWidth,
                  }),
            user: cur.user,
            user_id: cur.user_id,
          };
        });

        return [...attachmentPhotos, ...acc] as Photo[];
      }, []),
    [autoPlayVideo, fullWindowHeight, fullWindowWidth, giphyVersion, messages, resizableCDNHosts],
  );

  /**
   * The URL for the images may differ because of dimensions passed as
   * part of the query.
   */
  const stripQueryFromUrl = (url: string) => url.split('?')[0];

  const photoSelectedIndex = useMemo(() => {
    const idx = photos.findIndex(
      (photo) =>
        photo.messageId === selectedMessage?.messageId &&
        stripQueryFromUrl(photo.uri) === stripQueryFromUrl(selectedMessage?.url || ''),
    );

    return idx === -1 ? 0 : idx;
  }, [photos, selectedMessage]);

  /**
   * JS and UI index values, the JS follows the UI but is needed
   * for rendering the virtualized image list
   */
  const [selectedIndex, setSelectedIndex] = useState(photoSelectedIndex);
  const index = useSharedValue(photoSelectedIndex);

  const [imageGalleryAttachments, setImageGalleryAttachments] = useState<Photo[]>(photos);

  /**
   * Photos length needs to be kept as a const here so if the length
   * changes it causes the pan gesture handler function to refresh. This
   * does not work if the calculation for the length of the array is left
   * inside the gesture handler as it will have an array as a dependency
   */
  const photoLength = photos.length;

  /**
   * Set selected photo when changed via pressing in the message list
   */
  useEffect(() => {
    const updatePosition = (newIndex: number) => {
      'worklet';

      if (newIndex > -1) {
        index.value = newIndex;
        translationX.value = -(fullWindowWidth + MARGIN) * newIndex;
        runOnJS(setSelectedIndex)(newIndex);
      }
    };

    const newIndex = photos.findIndex(
      (photo) =>
        photo.messageId === selectedMessage?.messageId &&
        stripQueryFromUrl(photo.uri) === stripQueryFromUrl(selectedMessage?.url || ''),
    );

    runOnUI(updatePosition)(newIndex);
  }, [selectedMessage, photos, index, translationX, fullWindowWidth]);

  /**
   * Image heights are not provided and therefore need to be calculated.
   * We start by allowing the image to be the full height then reduce it
   * to the proper scaled height based on the width being restricted to the
   * screen width when the dimensions are received.
   */
  const uriForCurrentImage = imageGalleryAttachments[selectedIndex]?.uri;

  useEffect(() => {
    let currentImageHeight = fullWindowHeight;
    const photo = imageGalleryAttachments[index.value];
    const height = photo?.original_height;
    const width = photo?.original_width;

    if (height && width) {
      const imageHeight = Math.floor(height * (fullWindowWidth / width));
      currentImageHeight = imageHeight > fullWindowHeight ? fullWindowHeight : imageHeight;
    } else if (photo?.uri) {
      if (photo.type === FileTypes.Image) {
        Image.getSize(photo.uri, (width, height) => {
          const imageHeight = Math.floor(height * (fullWindowWidth / width));
          currentImageHeight = imageHeight > fullWindowHeight ? fullWindowHeight : imageHeight;
        });
      }
    }

    setCurrentImageHeight(currentImageHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uriForCurrentImage]);

  const { doubleTap, pan, pinch, singleTap } = useImageGalleryGestures({
    currentImageHeight,
    halfScreenHeight,
    halfScreenWidth,
    headerFooterVisible,
    offsetScale,
    overlayOpacity,
    photoLength,
    scale,
    screenHeight: fullWindowHeight,
    screenWidth: fullWindowWidth,
    selectedIndex,
    setSelectedIndex,
    translateX,
    translateY,
    translationX,
  });

  /**
   * If the header is visible we scale down the opacity of it as the
   * image is swiped downward
   */
  const headerFooterOpacity = useDerivedValue(
    () =>
      currentImageHeight * scale.value < fullWindowHeight && translateY.value > 0
        ? 1 - translateY.value / quarterScreenHeight
        : currentImageHeight * scale.value > fullWindowHeight &&
            translateY.value > (currentImageHeight / 2) * scale.value - halfScreenHeight
          ? 1 -
            (translateY.value - ((currentImageHeight / 2) * scale.value - halfScreenHeight)) /
              quarterScreenHeight
          : 1,
    [currentImageHeight],
  );

  /**
   * This transition and scaleX reverse lets use scroll left
   */
  const pagerStyle = useAnimatedStyle<ImageStyle>(
    () => ({
      transform: [
        { scaleX: -1 },
        {
          translateX: translationX.value,
        },
      ],
    }),
    [],
  );

  /**
   * Simple background color animation on Y movement
   */
  const containerBackground = useAnimatedStyle<ViewStyle>(
    () => ({
      backgroundColor: backgroundColor || white_snow,
      opacity: headerFooterOpacity.value,
    }),
    [headerFooterOpacity],
  );

  /**
   * Show screen style as component is always rendered we hide it
   * down and up and set opacity to 0 for good measure
   */
  const showScreenStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      transform: [
        {
          translateY: screenTranslateY.value,
        },
      ],
    }),
    [],
  );

  /**
   * Functions toclose BottomSheetModal with image grid
   */
  const closeGridView = () => {
    if (bottomSheetModalRef.current?.close) {
      bottomSheetModalRef.current.close();
      setGridPhotos([]);
    }
  };

  /**
   * Function to open BottomSheetModal with image grid
   */
  const openGridView = () => {
    if (bottomSheetModalRef.current?.present) {
      bottomSheetModalRef.current.present();
      setGridPhotos(imageGalleryAttachments);
    }
  };

  const handleEnd = () => {
    handlePlayPause(imageGalleryAttachments[selectedIndex].id, true);
    handleProgress(imageGalleryAttachments[selectedIndex].id, 1, true);
  };

  const videoRef = useRef<VideoType>(null);

  const handleLoad = (index: string, duration: number) => {
    setImageGalleryAttachments((prevImageGalleryAttachment) =>
      prevImageGalleryAttachment.map((imageGalleryAttachment) => ({
        ...imageGalleryAttachment,
        duration: imageGalleryAttachment.id === index ? duration : imageGalleryAttachment.duration,
      })),
    );
  };

  const handleProgress = (index: string, progress: number, hasEnd?: boolean) => {
    setImageGalleryAttachments((prevImageGalleryAttachments) =>
      prevImageGalleryAttachments.map((imageGalleryAttachment) => ({
        ...imageGalleryAttachment,
        progress:
          imageGalleryAttachment.id === index
            ? hasEnd
              ? 1
              : progress
            : imageGalleryAttachment.progress,
      })),
    );
  };

  const handlePlayPause = (index: string, pausedStatus?: boolean) => {
    if (pausedStatus === false) {
      // If the status is false we set the audio with the index as playing and the others as paused.
      setImageGalleryAttachments((prevImageGalleryAttachment) =>
        prevImageGalleryAttachment.map((imageGalleryAttachment) => ({
          ...imageGalleryAttachment,
          paused: imageGalleryAttachment.id === index ? false : true,
        })),
      );

      if (videoRef.current?.play) {
        videoRef.current.play();
      }
    } else {
      // If the status is true we simply set all the audio's paused state as true.
      setImageGalleryAttachments((prevImageGalleryAttachment) =>
        prevImageGalleryAttachment.map((imageGalleryAttachment) => ({
          ...imageGalleryAttachment,
          paused: true,
        })),
      );

      if (videoRef.current?.pause) {
        videoRef.current.pause();
      }
    }
  };

  const onPlayPause = (status?: boolean) => {
    if (status === undefined) {
      if (imageGalleryAttachments[selectedIndex].paused) {
        handlePlayPause(imageGalleryAttachments[selectedIndex].id, false);
      } else {
        handlePlayPause(imageGalleryAttachments[selectedIndex].id, true);
      }
    } else {
      handlePlayPause(imageGalleryAttachments[selectedIndex].id, status);
    }
  };

  const MemoizedImageGridHandle = useCallback(
    () => (
      <ImageGridHandle
        closeGridView={closeGridView}
        {...imageGalleryCustomComponents?.gridHandle}
      />
    ),
    [imageGalleryCustomComponents?.gridHandle],
  );

  return (
    <Animated.View
      accessibilityLabel='Image Gallery'
      pointerEvents={'auto'}
      style={[StyleSheet.absoluteFillObject, showScreenStyle]}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, containerBackground]} />
      <GestureDetector gesture={Gesture.Simultaneous(singleTap, doubleTap, pinch, pan)}>
        <Animated.View style={StyleSheet.absoluteFillObject}>
          <Animated.View style={[styles.animatedContainer, pagerStyle, pager]}>
            {imageGalleryAttachments.map((photo, i) =>
              photo.type === FileTypes.Video ? (
                <AnimatedGalleryVideo
                  attachmentId={photo.id}
                  handleEnd={handleEnd}
                  handleLoad={handleLoad}
                  handleProgress={handleProgress}
                  index={i}
                  key={`${photo.uri}-${i}`}
                  offsetScale={offsetScale}
                  paused={photo.paused || false}
                  previous={selectedIndex > i}
                  repeat={true}
                  scale={scale}
                  screenHeight={fullWindowHeight}
                  selected={selectedIndex === i}
                  shouldRender={Math.abs(selectedIndex - i) < 4}
                  source={{ uri: photo.uri }}
                  style={[
                    {
                      height: fullWindowHeight * 8,
                      marginRight: MARGIN,
                      width: fullWindowWidth * 8,
                    },
                    slide,
                  ]}
                  translateX={translateX}
                  translateY={translateY}
                  videoRef={videoRef as RefObject<VideoType>}
                />
              ) : (
                <AnimatedGalleryImage
                  accessibilityLabel={'Image Item'}
                  index={i}
                  key={`${photo.uri}-${i}`}
                  offsetScale={offsetScale}
                  photo={photo}
                  previous={selectedIndex > i}
                  scale={scale}
                  screenHeight={fullWindowHeight}
                  selected={selectedIndex === i}
                  shouldRender={Math.abs(selectedIndex - i) < 4}
                  style={[
                    {
                      height: fullWindowHeight * 8,
                      marginRight: MARGIN,
                      width: fullWindowWidth * 8,
                    },
                    slide,
                  ]}
                  translateX={translateX}
                  translateY={translateY}
                />
              ),
            )}
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      <ImageGalleryHeader
        opacity={headerFooterOpacity}
        photo={imageGalleryAttachments[selectedIndex]}
        visible={headerFooterVisible}
        {...imageGalleryCustomComponents?.header}
      />

      {imageGalleryAttachments[selectedIndex] && (
        <ImageGalleryFooter
          accessibilityLabel={'Image Gallery Footer'}
          duration={imageGalleryAttachments[selectedIndex].duration || 0}
          onPlayPause={onPlayPause}
          opacity={headerFooterOpacity}
          openGridView={openGridView}
          paused={imageGalleryAttachments[selectedIndex].paused || false}
          photo={imageGalleryAttachments[selectedIndex]}
          photoLength={imageGalleryAttachments.length}
          progress={imageGalleryAttachments[selectedIndex].progress || 0}
          selectedIndex={selectedIndex}
          videoRef={videoRef as RefObject<VideoType>}
          visible={headerFooterVisible}
          {...imageGalleryCustomComponents?.footer}
        />
      )}

      <ImageGalleryOverlay
        animatedBottomSheetIndex={animatedBottomSheetIndex}
        closeGridView={closeGridView}
        currentBottomSheetIndex={currentBottomSheetIndex}
      />
      <BottomSheetModalProvider>
        <BottomSheetModal
          animatedIndex={animatedBottomSheetIndex}
          enablePanDownToClose={true}
          handleComponent={MemoizedImageGridHandle}
          // @ts-ignore
          handleHeight={imageGalleryGridHandleHeight}
          index={0}
          onChange={(index: number) => setCurrentBottomSheetIndex(index)}
          ref={bottomSheetModalRef}
          snapPoints={imageGalleryGridSnapPoints || snapPoints}
        >
          <ImageGrid
            closeGridView={closeGridView}
            numberOfImageGalleryGridColumns={numberOfImageGalleryGridColumns}
            photos={gridPhotos}
            setSelectedMessage={setSelectedMessage}
            {...imageGalleryCustomComponents?.grid}
          />
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </Animated.View>
  );
};

/**
 * Clamping worklet to clamp the scaling
 */
export const clamp = (value: number, lowerBound: number, upperBound: number) => {
  'worklet';
  return Math.min(Math.max(lowerBound, value), upperBound);
};

const styles = StyleSheet.create({
  animatedContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});

export type Photo = {
  id: string;
  uri: string;
  channelId?: string;
  created_at?: string | Date;
  duration?: number;
  messageId?: string;
  mime_type?: string;
  original_height?: number;
  original_width?: number;
  paused?: boolean;
  progress?: number;
  thumb_url?: string;
  type?: string;
  user?: UserResponse | null;
  user_id?: string;
};

ImageGallery.displayName = 'ImageGallery{imageGallery}';
