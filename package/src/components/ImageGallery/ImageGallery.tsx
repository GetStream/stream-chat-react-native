import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  ImageStyle,
  Keyboard,
  Platform,
  StatusBar,
  StyleSheet,
  ViewStyle,
} from 'react-native';

import {
  PanGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
} from 'react-native-gesture-handler';

import Animated, {
  Easing,
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';

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

import { useImageGalleryContext } from '../../contexts/imageGalleryContext/ImageGalleryContext';
import {
  OverlayProviderProps,
  useOverlayContext,
} from '../../contexts/overlayContext/OverlayContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { isVideoPackageAvailable, VideoType } from '../../native';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { getResizedImageUrl } from '../../utils/getResizedImageUrl';
import { getUrlOfImageAttachment } from '../../utils/getUrlOfImageAttachment';
import { vh, vw } from '../../utils/utils';
import { getGiphyMimeType } from '../Attachment/utils/getGiphyMimeType';

const isAndroid = Platform.OS === 'android';
const fullScreenHeight = Dimensions.get('screen').height;
const measuredScreenHeight = vh(100);
const screenWidth = vw(100);
const halfScreenWidth = vw(50);
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

export type ImageGalleryCustomComponents<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
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
    footer?: ImageGalleryFooterCustomComponentProps<StreamChatGenerics>;
    grid?: ImageGalleryGridImageComponents<StreamChatGenerics>;
    gridHandle?: ImageGalleryGridHandleCustomComponentProps;
    header?: ImageGalleryHeaderCustomComponentProps<StreamChatGenerics>;
  };
};

type Props<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  ImageGalleryCustomComponents<StreamChatGenerics> & {
    overlayOpacity: Animated.SharedValue<number>;
  } & Pick<
      OverlayProviderProps<StreamChatGenerics>,
      | 'giphyVersion'
      | 'imageGalleryGridSnapPoints'
      | 'imageGalleryGridHandleHeight'
      | 'numberOfImageGalleryGridColumns'
      | 'autoPlayVideo'
    >;

export const ImageGallery = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: Props<StreamChatGenerics>,
) => {
  const {
    autoPlayVideo = false,
    giphyVersion = 'fixed_height',
    imageGalleryCustomComponents,
    imageGalleryGridHandleHeight,
    imageGalleryGridSnapPoints,
    numberOfImageGalleryGridColumns,
    overlayOpacity,
  } = props;
  const [imageGalleryAttachments, setImageGalleryAttachments] = useState<
    Photo<StreamChatGenerics>[]
  >([]);
  const {
    theme: {
      colors: { white_snow },
      imageGallery: { backgroundColor, pager, slide },
    },
  } = useTheme();
  const [gridPhotos, setGridPhotos] = useState<Photo<StreamChatGenerics>[]>([]);
  const { overlay, translucentStatusBar } = useOverlayContext();
  const { messages, selectedMessage, setSelectedMessage } =
    useImageGalleryContext<StreamChatGenerics>();

  /**
   * Height constants
   */
  const statusBarHeight = StatusBar.currentHeight ?? 0;
  const bottomBarHeight = fullScreenHeight - measuredScreenHeight - statusBarHeight;
  const androidScreenHeightAdjustment = translucentStatusBar
    ? bottomBarHeight === statusBarHeight || bottomBarHeight < 0
      ? 0
      : statusBarHeight
    : bottomBarHeight === statusBarHeight || bottomBarHeight < 0
    ? -statusBarHeight
    : 0;
  const screenHeight = isAndroid
    ? Dimensions.get('window').height + androidScreenHeightAdjustment
    : vh(100);
  const halfScreenHeight = screenHeight / 2;
  const quarterScreenHeight = screenHeight / 4;
  const snapPoints = React.useMemo(
    () => [(screenHeight * 3) / 4, screenHeight - (imageGalleryGridHandleHeight ?? 40)],
    [],
  );

  /**
   * BottomSheetModal ref
   */
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  /**
   * BottomSheetModal state
   */
  const [currentBottomSheetIndex, setCurrentBottomSheetIndex] = useState(0);
  const animatedBottomSheetIndex = useSharedValue(0);

  /**
   * Fade animation for screen, it is always rendered with pointerEvents
   * set to none for fast opening
   */
  const screenTranslateY = useSharedValue(screenHeight);
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
  }, []);

  /**
   * Image height from URL or default to full screen height
   */
  const [currentImageHeight, setCurrentImageHeight] = useState<number>(screenHeight);

  /**
   * JS and UI index values, the JS follows the UI but is needed
   * for rendering the virtualized image list
   */
  const [selectedIndex, setSelectedIndex] = useState(0);
  const index = useSharedValue(0);

  /**
   * Header visible value for animating in out
   */
  const headerFooterVisible = useSharedValue(1);

  /**
   * Gesture handler refs
   */
  const doubleTapRef = useRef<TapGestureHandler>(null);
  const panRef = useRef<PanGestureHandler>(null);
  const pinchRef = useRef<PinchGestureHandler>(null);
  const singleTapRef = useRef<TapGestureHandler>(null);

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

  const photos = messages.reduce((acc: Photo<StreamChatGenerics>[], cur) => {
    const attachmentImages =
      cur.attachments
        ?.filter(
          (attachment) =>
            (attachment.type === 'giphy' &&
              (attachment.giphy?.[giphyVersion]?.url ||
                attachment.thumb_url ||
                attachment.image_url)) ||
            (attachment.type === 'image' &&
              !attachment.title_link &&
              !attachment.og_scrape_url &&
              getUrlOfImageAttachment(attachment)) ||
            (isVideoPackageAvailable() && attachment.type === 'video'),
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
        type: a.type,
        uri:
          a.type === 'giphy'
            ? giphyURL
            : getResizedImageUrl({
                height: screenHeight,
                url: imageUrl,
                width: screenWidth,
              }),
        user: cur.user,
        user_id: cur.user_id,
      };
    });

    return [...attachmentPhotos, ...acc] as Photo<StreamChatGenerics>[];
  }, []);

  /**
   * Photos length needs to be kept as a const here so if the length
   * changes it causes the pan gesture handler function to refresh. This
   * does not work if the calculation for the length of the array is left
   * inside the gesture handler as it will have an array as a dependency
   */
  const photoLength = photos.length;

  useEffect(() => {
    setImageGalleryAttachments(photos);
  }, []);

  /**
   * The URL for the images may differ because of dimensions passed as
   * part of the query.
   */
  const stripQueryFromUrl = (url: string) => url.split('?')[0];

  /**
   * Set selected photo when changed via pressing in the message list
   */
  useEffect(() => {
    const updatePosition = (newIndex: number) => {
      'worklet';

      if (newIndex > -1) {
        index.value = newIndex;
        translationX.value = -(screenWidth + MARGIN) * newIndex;
        runOnJS(setSelectedIndex)(newIndex);
      }
    };

    const newIndex = photos.findIndex(
      (photo) =>
        photo.messageId === selectedMessage?.messageId &&
        stripQueryFromUrl(photo.uri) === stripQueryFromUrl(selectedMessage?.url || ''),
    );

    runOnUI(updatePosition)(newIndex);
  }, [selectedMessage, photoLength]);

  /**
   * Image heights are not provided and therefore need to be calculated.
   * We start by allowing the image to be the full height then reduce it
   * to the proper scaled height based on the width being restricted to the
   * screen width when the dimensions are received.
   */
  const uriForCurrentImage = imageGalleryAttachments[selectedIndex]?.uri;

  useEffect(() => {
    setCurrentImageHeight(screenHeight);
    const photo = imageGalleryAttachments[index.value];
    const height = photo?.original_height;
    const width = photo?.original_width;

    if (height && width) {
      const imageHeight = Math.floor(height * (screenWidth / width));
      setCurrentImageHeight(imageHeight > screenHeight ? screenHeight : imageHeight);
    } else if (photo?.uri) {
      if (photo.type === 'image') {
        Image.getSize(photo.uri, (width, height) => {
          const imageHeight = Math.floor(height * (screenWidth / width));
          setCurrentImageHeight(imageHeight > screenHeight ? screenHeight : imageHeight);
        });
      }
    }
  }, [uriForCurrentImage]);

  const { onDoubleTap, onPan, onPinch, onSingleTap } = useImageGalleryGestures({
    currentImageHeight,
    halfScreenHeight,
    halfScreenWidth,
    headerFooterVisible,
    offsetScale,
    overlayOpacity,
    photoLength,
    scale,
    screenHeight,
    screenWidth,
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
      currentImageHeight * scale.value < screenHeight && translateY.value > 0
        ? 1 - translateY.value / quarterScreenHeight
        : currentImageHeight * scale.value > screenHeight &&
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
    } else {
      // If the status is true we simply set all the audio's paused state as true.
      setImageGalleryAttachments((prevImageGalleryAttachment) =>
        prevImageGalleryAttachment.map((imageGalleryAttachment) => ({
          ...imageGalleryAttachment,
          paused: true,
        })),
      );
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

  return (
    <Animated.View
      accessibilityLabel='Image Gallery'
      pointerEvents={'auto'}
      style={[StyleSheet.absoluteFillObject, showScreenStyle]}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, containerBackground]} />
      <TapGestureHandler
        minPointers={1}
        numberOfTaps={1}
        onGestureEvent={onSingleTap}
        ref={singleTapRef}
        waitFor={[panRef, pinchRef, doubleTapRef]}
      >
        <Animated.View style={StyleSheet.absoluteFillObject}>
          <TapGestureHandler
            maxDeltaX={8}
            maxDeltaY={8}
            maxDist={8}
            minPointers={1}
            numberOfTaps={2}
            onGestureEvent={onDoubleTap}
            ref={doubleTapRef}
          >
            <Animated.View style={StyleSheet.absoluteFillObject}>
              <PinchGestureHandler
                onGestureEvent={onPinch}
                ref={pinchRef}
                simultaneousHandlers={[panRef]}
              >
                <Animated.View style={StyleSheet.absoluteFill}>
                  <PanGestureHandler
                    enabled={overlay === 'gallery'}
                    maxPointers={isAndroid ? undefined : 1}
                    minDist={10}
                    onGestureEvent={onPan}
                    ref={panRef}
                    simultaneousHandlers={[pinchRef]}
                  >
                    <Animated.View style={StyleSheet.absoluteFill}>
                      <Animated.View
                        style={[
                          styles.animatedContainer,
                          pagerStyle,
                          pager,
                          {
                            transform: [
                              { scaleX: -1 }, // Also only here for opening, wrong direction when not included
                              {
                                translateX: translationX.value, // Only here for opening, wrong index when this is not included
                              },
                            ],
                          },
                        ]}
                      >
                        {imageGalleryAttachments.map((photo, i) =>
                          photo.type === 'video' ? (
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
                              screenHeight={screenHeight}
                              selected={selectedIndex === i}
                              shouldRender={Math.abs(selectedIndex - i) < 4}
                              source={{ uri: photo.uri }}
                              style={[
                                {
                                  height: screenHeight * 8,
                                  marginRight: MARGIN,
                                  width: screenWidth * 8,
                                },
                                slide,
                              ]}
                              translateX={translateX}
                              translateY={translateY}
                              videoRef={videoRef}
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
                              screenHeight={screenHeight}
                              selected={selectedIndex === i}
                              shouldRender={Math.abs(selectedIndex - i) < 4}
                              style={[
                                {
                                  height: screenHeight * 8,
                                  marginRight: MARGIN,
                                  width: screenWidth * 8,
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
                  </PanGestureHandler>
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </TapGestureHandler>
        </Animated.View>
      </TapGestureHandler>
      <ImageGalleryHeader<StreamChatGenerics>
        opacity={headerFooterOpacity}
        photo={imageGalleryAttachments[selectedIndex]}
        visible={headerFooterVisible}
        {...imageGalleryCustomComponents?.header}
      />

      {imageGalleryAttachments.length > 0 && (
        <ImageGalleryFooter<StreamChatGenerics>
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
          handleComponent={() => (
            <ImageGridHandle
              closeGridView={closeGridView}
              {...imageGalleryCustomComponents?.gridHandle}
            />
          )}
          handleHeight={imageGalleryGridHandleHeight ?? 40}
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

export type Photo<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
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
  type?: string;
  user?: UserResponse<StreamChatGenerics> | null;
  user_id?: string;
};

ImageGallery.displayName = 'ImageGallery{imageGallery}';
