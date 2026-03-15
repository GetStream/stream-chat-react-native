import React, { useMemo } from 'react';
import { ImageErrorEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Attachment, LocalMessage } from 'stream-chat';

import { GalleryImage } from './GalleryImage';
import { buildGallery } from './utils/buildGallery/buildGallery';

import type { Thumbnail } from './utils/buildGallery/types';
import {
  GalleryImageBorderRadius,
  getGalleryImageBorderRadius,
} from './utils/getGalleryImageBorderRadius';

import { openUrlSafely } from './utils/openUrlSafely';

import { useTranslationContext } from '../../contexts';
import { useChatConfigContext } from '../../contexts/chatConfigContext/ChatConfigContext';
import {
  ImageGalleryContextValue,
  useImageGalleryContext,
} from '../../contexts/imageGalleryContext/ImageGalleryContext';
import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import {
  OverlayContextValue,
  useOverlayContext,
} from '../../contexts/overlayContext/OverlayContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import { useLoadingImage } from '../../hooks/useLoadingImage';
import { useStableCallback } from '../../hooks/useStableCallback';
import { isVideoPlayerAvailable } from '../../native';
import { primitives } from '../../theme';
import { FileTypes } from '../../types/types';
import { getUrlWithoutParams } from '../../utils/utils';

export type GalleryPropsWithContext = Pick<ImageGalleryContextValue, 'imageGalleryStateStore'> &
  Pick<
    MessageContextValue,
    | 'alignment'
    | 'images'
    | 'videos'
    | 'onLongPress'
    | 'onPress'
    | 'onPressIn'
    | 'preventPress'
    | 'message'
    | 'messageContentOrder'
  > &
  Pick<
    MessagesContextValue,
    | 'additionalPressableProps'
    | 'VideoThumbnail'
    | 'ImageLoadingIndicator'
    | 'ImageLoadingFailedIndicator'
    | 'myMessageTheme'
  > &
  Pick<OverlayContextValue, 'setOverlay'> & {
    channelId: string | undefined;
    messageHasOnlyOneMedia: boolean;
  };

const GalleryWithContext = (props: GalleryPropsWithContext) => {
  const {
    additionalPressableProps,
    alignment,
    imageGalleryStateStore,
    ImageLoadingFailedIndicator,
    ImageLoadingIndicator,
    images,
    message,
    onLongPress,
    onPress,
    onPressIn,
    preventPress,
    setOverlay,
    videos,
    VideoThumbnail,
    messageHasOnlyOneMedia = false,
  } = props;

  const { resizableCDNHosts } = useChatConfigContext();
  const {
    theme: {
      messageSimple: {
        gallery: {
          galleryContainer,
          galleryItemColumn,
          gridHeight,
          gridWidth,
          maxHeight,
          maxWidth,
          minHeight,
          minWidth,
        },
      },
    },
  } = useTheme();

  const styles = useStyles();

  const sizeConfig = {
    gridHeight,
    gridWidth,
    maxHeight,
    maxWidth,
    minHeight,
    minWidth,
  };

  const imagesAndVideos = [...(images || []), ...(videos || [])];
  const imagesAndVideosValue = `${images?.length}${videos?.length}${images
    ?.map((i) => `${i.image_url}${i.thumb_url}`)
    .join('')}${videos?.map((i) => `${i.image_url}${i.thumb_url}`).join('')}`;

  const { height, invertedDirections, thumbnailGrid, width } = useMemo(
    () =>
      buildGallery({
        images: imagesAndVideos,
        resizableCDNHosts,
        sizeConfig,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [imagesAndVideosValue],
  );

  if (!imagesAndVideos?.length) {
    return null;
  }
  const numOfColumns = thumbnailGrid.length;

  return (
    <View
      style={[
        styles.container,
        {
          flexDirection: invertedDirections ? 'column' : 'row',
          alignSelf: alignment === 'right' ? 'flex-end' : 'flex-start',
        },
        imagesAndVideos.length !== 1
          ? { width: gridWidth, height: gridHeight }
          : {
              minHeight: height,
              minWidth: width,
            },
        galleryContainer,
      ]}
      testID='gallery-container'
    >
      {thumbnailGrid.map((rows, colIndex) => {
        const numOfRows = rows.length;
        return (
          <View
            key={`gallery-${invertedDirections ? 'row' : 'column'}-${colIndex}`}
            style={[
              styles.galleryItemColumn,
              {
                flexDirection: invertedDirections ? 'row' : 'column',
              },
              galleryItemColumn,
            ]}
            testID={`gallery-${invertedDirections ? 'row' : 'column'}-${colIndex}`}
          >
            {rows.map((thumbnail, rowIndex) => {
              const borderRadius = getGalleryImageBorderRadius({
                colIndex,
                height,
                invertedDirections,
                numOfColumns,
                numOfRows,
                rowIndex,
                sizeConfig,
                width,
                messageHasOnlyOneMedia,
              });

              if (!message) {
                return null;
              }

              return (
                <GalleryThumbnail
                  additionalPressableProps={additionalPressableProps}
                  borderRadius={borderRadius}
                  colIndex={colIndex}
                  imageGalleryStateStore={imageGalleryStateStore}
                  ImageLoadingFailedIndicator={ImageLoadingFailedIndicator}
                  ImageLoadingIndicator={ImageLoadingIndicator}
                  imagesAndVideos={imagesAndVideos}
                  invertedDirections={invertedDirections || false}
                  key={rowIndex}
                  message={message}
                  numOfColumns={numOfColumns}
                  numOfRows={numOfRows}
                  onLongPress={onLongPress}
                  onPress={onPress}
                  onPressIn={onPressIn}
                  preventPress={preventPress}
                  rowIndex={rowIndex}
                  setOverlay={setOverlay}
                  thumbnail={thumbnail}
                  VideoThumbnail={VideoThumbnail}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

type GalleryThumbnailProps = {
  borderRadius: GalleryImageBorderRadius;
  colIndex: number;
  imagesAndVideos: Attachment[];
  invertedDirections: boolean;
  message: LocalMessage;
  numOfColumns: number;
  numOfRows: number;
  rowIndex: number;
  thumbnail: Thumbnail;
} & Pick<
  MessagesContextValue,
  | 'additionalPressableProps'
  | 'VideoThumbnail'
  | 'ImageLoadingIndicator'
  | 'ImageLoadingFailedIndicator'
> &
  Pick<ImageGalleryContextValue, 'imageGalleryStateStore'> &
  Pick<MessageContextValue, 'onLongPress' | 'onPress' | 'onPressIn' | 'preventPress'> &
  Pick<OverlayContextValue, 'setOverlay'>;

const GalleryThumbnail = ({
  additionalPressableProps,
  borderRadius,
  colIndex,
  imageGalleryStateStore,
  ImageLoadingFailedIndicator,
  ImageLoadingIndicator,
  imagesAndVideos,
  invertedDirections,
  message,
  numOfColumns,
  numOfRows,
  onLongPress,
  onPress,
  onPressIn,
  preventPress,
  rowIndex,
  setOverlay,
  thumbnail,
  VideoThumbnail,
}: GalleryThumbnailProps) => {
  const {
    theme: {
      messageSimple: {
        gallery: { image, imageBorderRadius, imageContainer, moreImagesContainer, moreImagesText },
      },
      semantics,
    },
  } = useTheme();
  const { t } = useTranslationContext();
  const styles = useStyles();

  const openImageViewer = () => {
    if (!message) {
      return;
    }
    imageGalleryStateStore.openImageGallery({
      messages: [message],
      selectedAttachmentUrl: thumbnail.url,
    });
    setOverlay('gallery');
  };

  const defaultOnPress = () => {
    // If the url is defined then only try to open the file.
    if (thumbnail.url) {
      if (thumbnail.type === FileTypes.Video && !isVideoPlayerAvailable()) {
        // This condition is kinda unreachable, since we render videos as file attachment if the video
        // library is not installed. But doesn't hurt to have extra safeguard, in case of some customizations.
        openUrlSafely(thumbnail.url);
      } else {
        openImageViewer();
      }
    }
  };

  return (
    <Pressable
      disabled={preventPress}
      key={`gallery-item-${message.id}/${colIndex}/${rowIndex}/${imagesAndVideos.length}`}
      onLongPress={(event) => {
        if (onLongPress) {
          onLongPress({
            additionalInfo: { thumbnail },
            emitter: 'gallery',
            event,
          });
        }
      }}
      onPress={(event) => {
        if (onPress) {
          onPress({
            additionalInfo: { thumbnail },
            defaultHandler: defaultOnPress,
            emitter: 'gallery',
            event,
          });
        }
      }}
      onPressIn={(event) => {
        if (onPressIn) {
          onPressIn({
            additionalInfo: { thumbnail },
            defaultHandler: defaultOnPress,
            emitter: 'gallery',
            event,
          });
        }
      }}
      style={({ pressed }) => [
        styles.imageContainer,
        {
          opacity: pressed ? 0.8 : 1,
          flex: thumbnail.flex,
        },
        imageContainer,
      ]}
      testID={`gallery-${invertedDirections ? 'row' : 'column'}-${colIndex}-item-${rowIndex}`}
      {...additionalPressableProps}
    >
      {thumbnail.type === FileTypes.Video ? (
        <VideoThumbnail
          style={[styles.image, imageBorderRadius ?? borderRadius, image]}
          thumb_url={thumbnail.thumb_url}
        />
      ) : (
        <GalleryImageThumbnail
          borderRadius={imageBorderRadius ?? borderRadius}
          ImageLoadingFailedIndicator={ImageLoadingFailedIndicator}
          ImageLoadingIndicator={ImageLoadingIndicator}
          thumbnail={thumbnail}
        />
      )}
      {colIndex === numOfColumns - 1 && rowIndex === numOfRows - 1 && imagesAndVideos.length > 4 ? (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.moreImagesContainer,
            { backgroundColor: semantics.backgroundCoreOverlayDark },
            borderRadius,
            moreImagesContainer,
          ]}
        >
          <Text style={[styles.moreImagesText, moreImagesText]}>
            {String(t('+{{count}}', { count: imagesAndVideos.length - 4 }))}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
};

const GalleryImageThumbnail = ({
  borderRadius,
  ImageLoadingFailedIndicator,
  ImageLoadingIndicator,
  thumbnail,
}: Pick<
  GalleryThumbnailProps,
  'ImageLoadingFailedIndicator' | 'ImageLoadingIndicator' | 'thumbnail' | 'borderRadius'
>) => {
  const {
    isLoadingImage,
    isLoadingImageError,
    onReloadImage,
    setLoadingImage,
    setLoadingImageError,
  } = useLoadingImage();

  const {
    theme: {
      messageSimple: { gallery },
    },
  } = useTheme();

  const styles = useStyles();

  const onLoadStart = useStableCallback(() => {
    setLoadingImageError(false);
    setLoadingImage(true);
  });

  const onLoad = useStableCallback(() => {
    setTimeout(() => {
      setLoadingImage(false);
      setLoadingImageError(false);
    }, 0);
  });

  const onError = useStableCallback(({ nativeEvent: { error } }: ImageErrorEvent) => {
    console.warn(error);
    setLoadingImage(false);
    setLoadingImageError(true);
  });

  return (
    <View style={[styles.image, borderRadius]}>
      {isLoadingImageError ? (
        <ImageLoadingFailedIndicator onReloadImage={onReloadImage} />
      ) : (
        <>
          <GalleryImage
            onError={onError}
            onLoad={onLoad}
            onLoadStart={onLoadStart}
            resizeMode={thumbnail.resizeMode}
            style={gallery.image}
            uri={thumbnail.url}
          />
          {isLoadingImage ? <ImageLoadingIndicator /> : null}
        </>
      )}
    </View>
  );
};

const areEqual = (prevProps: GalleryPropsWithContext, nextProps: GalleryPropsWithContext) => {
  const {
    alignment: prevAlignment,
    images: prevImages,
    message: prevMessage,
    myMessageTheme: prevMyMessageTheme,
    videos: prevVideos,
  } = prevProps;
  const {
    alignment: nextAlignment,
    images: nextImages,
    message: nextMessage,
    myMessageTheme: nextMyMessageTheme,
    videos: nextVideos,
  } = nextProps;

  const alignmentEqual = prevAlignment === nextAlignment;
  if (!alignmentEqual) {
    return false;
  }

  const messageEqual =
    prevMessage?.id === nextMessage?.id &&
    `${prevMessage?.updated_at}` === `${nextMessage?.updated_at}`;
  if (!messageEqual) {
    return false;
  }

  const imagesEqual =
    prevImages.length === nextImages.length &&
    prevImages.every(
      (image, index) =>
        getUrlWithoutParams(image.image_url) === getUrlWithoutParams(nextImages[index].image_url) &&
        getUrlWithoutParams(image.thumb_url) === getUrlWithoutParams(nextImages[index].thumb_url),
    );
  if (!imagesEqual) {
    return false;
  }

  const videosEqual =
    prevVideos.length === nextVideos.length &&
    prevVideos.every(
      (image, index) =>
        getUrlWithoutParams(image.image_url) === getUrlWithoutParams(nextVideos[index].image_url) &&
        getUrlWithoutParams(image.thumb_url) === getUrlWithoutParams(nextVideos[index].thumb_url),
    );
  if (!videosEqual) {
    return false;
  }

  const messageThemeEqual =
    JSON.stringify(prevMyMessageTheme) === JSON.stringify(nextMyMessageTheme);
  if (!messageThemeEqual) {
    return false;
  }

  return true;
};

const MemoizedGallery = React.memo(GalleryWithContext, areEqual) as typeof GalleryWithContext;

export type GalleryProps = Partial<GalleryPropsWithContext>;

/**
 * UI component for card in attachments.
 */
export const Gallery = (props: GalleryProps) => {
  const {
    alignment: propAlignment,
    additionalPressableProps: propAdditionalPressableProps,
    ImageLoadingFailedIndicator: PropImageLoadingFailedIndicator,
    ImageLoadingIndicator: PropImageLoadingIndicator,
    images: propImages,
    message: propMessage,
    myMessageTheme: propMyMessageTheme,
    onLongPress: propOnLongPress,
    onPress: propOnPress,
    onPressIn: propOnPressIn,
    preventPress: propPreventPress,
    setOverlay: propSetOverlay,
    videos: propVideos,
    VideoThumbnail: PropVideoThumbnail,
    messageContentOrder: propMessageContentOrder,
  } = props;

  const { imageGalleryStateStore } = useImageGalleryContext();
  const {
    alignment: contextAlignment,
    images: contextImages,
    message: contextMessage,
    onLongPress: contextOnLongPress,
    onPress: contextOnPress,
    onPressIn: contextOnPressIn,
    preventPress: contextPreventPress,
    videos: contextVideos,
    messageContentOrder: contextMessageContentOrder,
  } = useMessageContext();
  const {
    additionalPressableProps: contextAdditionalPressableProps,
    ImageLoadingFailedIndicator: ContextImageLoadingFailedIndicator,
    ImageLoadingIndicator: ContextImageLoadingIndicator,
    myMessageTheme: contextMyMessageTheme,
    VideoThumbnail: ContextVideoThumnbnail,
  } = useMessagesContext();
  const { setOverlay: contextSetOverlay } = useOverlayContext();

  const images = propImages ?? contextImages ?? [];
  const videos = propVideos ?? contextVideos ?? [];
  const imagesAndVideos = [...images, ...videos];
  const message = propMessage || contextMessage;
  const alignment = propAlignment || contextAlignment;
  if (!images.length && !videos.length) {
    return null;
  }

  const additionalPressableProps = propAdditionalPressableProps || contextAdditionalPressableProps;
  const onLongPress = propOnLongPress || contextOnLongPress;
  const onPressIn = propOnPressIn || contextOnPressIn;
  const onPress = propOnPress || contextOnPress;
  const preventPress =
    typeof propPreventPress === 'boolean' ? propPreventPress : contextPreventPress;
  const setOverlay = propSetOverlay || contextSetOverlay;
  const VideoThumbnail = PropVideoThumbnail || ContextVideoThumnbnail;
  const ImageLoadingFailedIndicator =
    PropImageLoadingFailedIndicator || ContextImageLoadingFailedIndicator;
  const ImageLoadingIndicator = PropImageLoadingIndicator || ContextImageLoadingIndicator;
  const myMessageTheme = propMyMessageTheme || contextMyMessageTheme;
  const messageContentOrder = propMessageContentOrder || contextMessageContentOrder;

  const messageHasOnlyOneMedia =
    messageContentOrder?.length === 1 &&
    messageContentOrder?.includes('gallery') &&
    imagesAndVideos.length === 1;

  return (
    <MemoizedGallery
      {...{
        additionalPressableProps,
        alignment,
        channelId: message?.cid,
        imageGalleryStateStore,
        ImageLoadingFailedIndicator,
        ImageLoadingIndicator,
        images,
        message,
        myMessageTheme,
        onLongPress,
        onPress,
        onPressIn,
        preventPress,
        setOverlay,
        videos,
        VideoThumbnail,
        messageHasOnlyOneMedia,
        messageContentOrder,
      }}
    />
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const { isMyMessage } = useMessageContext();
  return useMemo(() => {
    return StyleSheet.create({
      errorTextSize: {
        fontSize: primitives.typographyFontSizeXs,
        lineHeight: primitives.typographyLineHeightTight,
        fontWeight: primitives.typographyFontWeightRegular,
        color: semantics.accentError,
      },
      galleryItemColumn: {
        gap: primitives.spacingXxs,
        flex: 1,
      },
      container: {
        flexDirection: 'row',
        gap: primitives.spacingXxs,
      },
      imageContainer: {},
      image: {
        flex: 1,
        backgroundColor: isMyMessage
          ? semantics.chatBgAttachmentOutgoing
          : semantics.chatBgAttachmentIncoming,
        overflow: 'hidden',
      },
      imageLoadingErrorIndicatorStyle: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
      },
      imageLoadingIndicatorContainer: {
        height: '100%',
        justifyContent: 'center',
        position: 'absolute',
        width: '100%',
      },
      imageLoadingIndicatorStyle: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
      },
      imageReloadContainerStyle: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
      },
      moreImagesContainer: {
        alignItems: 'center',
        justifyContent: 'center',
      },
      moreImagesText: {
        color: semantics.textOnAccent,
        fontSize: primitives.typographyFontSize2xl,
        lineHeight: primitives.typographyLineHeightRelaxed,
        fontWeight: primitives.typographyFontWeightSemiBold,
      },
      imageLoadingErrorContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
      },
      imageLoadingErrorWrapper: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
      },
    });
  }, [semantics, isMyMessage]);
};

Gallery.displayName = 'Gallery{messageSimple{gallery}}';
