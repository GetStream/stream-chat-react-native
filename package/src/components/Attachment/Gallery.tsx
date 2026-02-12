import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
import { isVideoPlayerAvailable } from '../../native';
import { primitives } from '../../theme';
import { FileTypes } from '../../types/types';
import { getUrlWithoutParams } from '../../utils/utils';

export type GalleryPropsWithContext = Pick<ImageGalleryContextValue, 'imageGalleryStateStore'> &
  Pick<
    MessageContextValue,
    'images' | 'videos' | 'onLongPress' | 'onPress' | 'onPressIn' | 'preventPress' | 'message'
  > &
  Pick<
    MessagesContextValue,
    | 'additionalPressableProps'
    | 'VideoThumbnail'
    | 'ImageLoadingIndicator'
    | 'ImageLoadingFailedIndicator'
    | 'ImageReloadIndicator'
    | 'myMessageTheme'
  > &
  Pick<OverlayContextValue, 'setOverlay'> & {
    channelId: string | undefined;
  };

const GalleryWithContext = (props: GalleryPropsWithContext) => {
  const {
    additionalPressableProps,
    imageGalleryStateStore,
    ImageLoadingFailedIndicator,
    ImageLoadingIndicator,
    ImageReloadIndicator,
    images,
    message,
    onLongPress,
    onPress,
    onPressIn,
    preventPress,
    setOverlay,
    videos,
    VideoThumbnail,
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
        },
        images.length !== 1
          ? { width: gridWidth, height: gridHeight }
          : {
              maxWidth,
              maxHeight,
              minWidth,
              minHeight,
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
                messageText: message?.text,
                numOfColumns,
                numOfRows,
                rowIndex,
                sizeConfig,
                width,
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
                  ImageReloadIndicator={ImageReloadIndicator}
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
  | 'ImageReloadIndicator'
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
  ImageReloadIndicator,
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
      colors: { overlay },
      messageSimple: {
        gallery: { image, imageBorderRadius, imageContainer, moreImagesContainer, moreImagesText },
      },
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
          ImageReloadIndicator={ImageReloadIndicator}
          thumbnail={thumbnail}
        />
      )}
      {colIndex === numOfColumns - 1 && rowIndex === numOfRows - 1 && imagesAndVideos.length > 4 ? (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.moreImagesContainer,
            { backgroundColor: overlay },
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
  ImageReloadIndicator,
  thumbnail,
}: Pick<
  GalleryThumbnailProps,
  | 'ImageLoadingFailedIndicator'
  | 'ImageLoadingIndicator'
  | 'ImageReloadIndicator'
  | 'thumbnail'
  | 'borderRadius'
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

  return (
    <View style={styles.image}>
      {isLoadingImageError ? (
        <>
          <ImageLoadingFailedIndicator style={styles.imageLoadingErrorIndicatorStyle} />
          <ImageReloadIndicator
            onReloadImage={onReloadImage}
            style={styles.imageReloadContainerStyle}
          />
        </>
      ) : (
        <>
          <GalleryImage
            onError={({ nativeEvent: { error } }) => {
              console.warn(error);
              setLoadingImage(false);
              setLoadingImageError(true);
            }}
            onLoadEnd={() => setTimeout(() => setLoadingImage(false), 0)}
            onLoadStart={() => setLoadingImage(true)}
            resizeMode={thumbnail.resizeMode}
            style={[borderRadius, gallery.image]}
            uri={thumbnail.url}
          />
          {isLoadingImage && (
            <View style={styles.imageLoadingIndicatorContainer}>
              <ImageLoadingIndicator style={styles.imageLoadingIndicatorStyle} />
            </View>
          )}
        </>
      )}
    </View>
  );
};

const areEqual = (prevProps: GalleryPropsWithContext, nextProps: GalleryPropsWithContext) => {
  const {
    images: prevImages,
    message: prevMessage,
    myMessageTheme: prevMyMessageTheme,
    videos: prevVideos,
  } = prevProps;
  const {
    images: nextImages,
    message: nextMessage,
    myMessageTheme: nextMyMessageTheme,
    videos: nextVideos,
  } = nextProps;

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
    additionalPressableProps: propAdditionalPressableProps,
    ImageLoadingFailedIndicator: PropImageLoadingFailedIndicator,
    ImageLoadingIndicator: PropImageLoadingIndicator,
    ImageReloadIndicator: PropImageReloadIndicator,
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
  } = props;

  const { imageGalleryStateStore } = useImageGalleryContext();
  const {
    images: contextImages,
    message: contextMessage,
    onLongPress: contextOnLongPress,
    onPress: contextOnPress,
    onPressIn: contextOnPressIn,
    preventPress: contextPreventPress,
    videos: contextVideos,
  } = useMessageContext();
  const {
    additionalPressableProps: contextAdditionalPressableProps,
    ImageLoadingFailedIndicator: ContextImageLoadingFailedIndicator,
    ImageLoadingIndicator: ContextImageLoadingIndicator,
    ImageReloadIndicator: ContextImageReloadIndicator,
    myMessageTheme: contextMyMessageTheme,
    VideoThumbnail: ContextVideoThumnbnail,
  } = useMessagesContext();
  const { setOverlay: contextSetOverlay } = useOverlayContext();

  const images = propImages || contextImages;
  const videos = propVideos || contextVideos;
  const message = propMessage || contextMessage;

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
  const ImageReloadIndicator = PropImageReloadIndicator || ContextImageReloadIndicator;
  const myMessageTheme = propMyMessageTheme || contextMyMessageTheme;

  return (
    <MemoizedGallery
      {...{
        additionalPressableProps,
        channelId: message?.cid,
        imageGalleryStateStore,
        ImageLoadingFailedIndicator,
        ImageLoadingIndicator,
        ImageReloadIndicator,
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
      }}
    />
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
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
        justifyContent: 'center',
        gap: primitives.spacingXxs,
      },
      imageContainer: {},
      image: {
        flex: 1,
      },
      imageLoadingErrorIndicatorStyle: {
        bottom: 4,
        left: 4,
        position: 'absolute',
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
    });
  }, [semantics]);
};

Gallery.displayName = 'Gallery{messageSimple{gallery}}';
