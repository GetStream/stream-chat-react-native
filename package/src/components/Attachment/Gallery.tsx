import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Attachment, LocalMessage } from 'stream-chat';

import { GalleryImage } from './GalleryImage';
import { buildGallery } from './utils/buildGallery/buildGallery';

import type { Thumbnail } from './utils/buildGallery/types';
import { getGalleryImageBorderRadius } from './utils/getGalleryImageBorderRadius';

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
import { FileTypes } from '../../types/types';
import { getUrlWithoutParams } from '../../utils/utils';

export type GalleryPropsWithContext = Pick<
  ImageGalleryContextValue,
  'setSelectedMessage' | 'setMessages'
> &
  Pick<
    MessageContextValue,
    | 'alignment'
    | 'groupStyles'
    | 'images'
    | 'videos'
    | 'onLongPress'
    | 'onPress'
    | 'onPressIn'
    | 'preventPress'
    | 'threadList'
  > &
  Pick<
    MessagesContextValue,
    | 'additionalPressableProps'
    | 'legacyImageViewerSwipeBehaviour'
    | 'VideoThumbnail'
    | 'ImageLoadingIndicator'
    | 'ImageLoadingFailedIndicator'
    | 'ImageReloadIndicator'
    | 'myMessageTheme'
  > &
  Pick<OverlayContextValue, 'setOverlay'> & {
    channelId: string | undefined;
    hasThreadReplies?: boolean;
    /**
     * `message` prop has been introduced here as part of `legacyImageViewerSwipeBehaviour` prop.
     * https://github.com/GetStream/stream-chat-react-native/commit/d5eac6193047916f140efe8e396a671675c9a63f
     * messageId and messageText may seem redundant now, but to avoid breaking change as part
     * of minor release, we are keeping those props.
     *
     * Also `message` type should ideally be imported from MessageContextValue and not be explicitely mentioned
     * here, but due to some circular dependencies within the SDK, it causes "excessive deep nesting" issue with
     * typescript within Channel component. We should take it as a mini-project and resolve all these circular imports.
     *
     * TODO: Fix circular dependencies of imports
     */
    message?: LocalMessage;
  };

const GalleryWithContext = (props: GalleryPropsWithContext) => {
  const {
    additionalPressableProps,
    alignment,
    groupStyles,
    hasThreadReplies,
    ImageLoadingFailedIndicator,
    ImageLoadingIndicator,
    ImageReloadIndicator,
    images,
    legacyImageViewerSwipeBehaviour,
    message,
    onLongPress,
    onPress,
    onPressIn,
    preventPress,
    setMessages,
    setOverlay,
    setSelectedMessage,
    threadList,
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
        styles.galleryContainer,
        {
          flexDirection: invertedDirections ? 'column' : 'row',
          height,
          width,
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
              {
                flexDirection: invertedDirections ? 'row' : 'column',
              },
              galleryItemColumn,
            ]}
            testID={`gallery-${invertedDirections ? 'row' : 'column'}-${colIndex}`}
          >
            {rows.map((thumbnail, rowIndex) => {
              const borderRadius = getGalleryImageBorderRadius({
                alignment,
                colIndex,
                groupStyles,
                hasThreadReplies,
                height,
                invertedDirections,
                messageText: message?.text,
                numOfColumns,
                numOfRows,
                rowIndex,
                sizeConfig,
                threadList,
                width,
              });

              if (message === undefined) {
                return null;
              }

              return (
                <GalleryThumbnail
                  additionalPressableProps={additionalPressableProps}
                  borderRadius={borderRadius}
                  colIndex={colIndex}
                  ImageLoadingFailedIndicator={ImageLoadingFailedIndicator}
                  ImageLoadingIndicator={ImageLoadingIndicator}
                  ImageReloadIndicator={ImageReloadIndicator}
                  imagesAndVideos={imagesAndVideos}
                  invertedDirections={invertedDirections || false}
                  key={rowIndex}
                  legacyImageViewerSwipeBehaviour={legacyImageViewerSwipeBehaviour}
                  message={message}
                  numOfColumns={numOfColumns}
                  numOfRows={numOfRows}
                  onLongPress={onLongPress}
                  onPress={onPress}
                  onPressIn={onPressIn}
                  preventPress={preventPress}
                  rowIndex={rowIndex}
                  setMessages={setMessages}
                  setOverlay={setOverlay}
                  setSelectedMessage={setSelectedMessage}
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
  borderRadius: {
    borderBottomLeftRadius: number;
    borderBottomRightRadius: number;
    borderTopLeftRadius: number;
    borderTopRightRadius: number;
  };
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
  | 'legacyImageViewerSwipeBehaviour'
  | 'VideoThumbnail'
  | 'ImageLoadingIndicator'
  | 'ImageLoadingFailedIndicator'
  | 'ImageReloadIndicator'
> &
  Pick<ImageGalleryContextValue, 'setSelectedMessage' | 'setMessages'> &
  Pick<MessageContextValue, 'onLongPress' | 'onPress' | 'onPressIn' | 'preventPress'> &
  Pick<OverlayContextValue, 'setOverlay'>;

const GalleryThumbnail = ({
  additionalPressableProps,
  borderRadius,
  colIndex,
  ImageLoadingFailedIndicator,
  ImageLoadingIndicator,
  ImageReloadIndicator,
  imagesAndVideos,
  invertedDirections,
  legacyImageViewerSwipeBehaviour,
  message,
  numOfColumns,
  numOfRows,
  onLongPress,
  onPress,
  onPressIn,
  preventPress,
  rowIndex,
  setMessages,
  setOverlay,
  setSelectedMessage,
  thumbnail,
  VideoThumbnail,
}: GalleryThumbnailProps) => {
  const {
    theme: {
      colors: { overlay },
      messageSimple: {
        gallery: {
          image,
          imageBorderRadius,
          imageContainer,
          imageContainerStyle,
          moreImagesContainer,
          moreImagesText,
        },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  const openImageViewer = () => {
    if (!legacyImageViewerSwipeBehaviour && message) {
      // Added if-else to keep the logic readable, instead of DRY.
      // if - legacyImageViewerSwipeBehaviour is disabled
      // else - legacyImageViewerSwipeBehaviour is enabled
      setMessages([message]);
      setSelectedMessage({ messageId: message.id, url: thumbnail.url });
      setOverlay('gallery');
    } else if (legacyImageViewerSwipeBehaviour) {
      setSelectedMessage({ messageId: message?.id, url: thumbnail.url });
      setOverlay('gallery');
    }
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
          height: thumbnail.height,
          opacity: pressed ? 0.8 : 1,
          width: thumbnail.width,
        },
        imageContainer,
      ]}
      testID={`gallery-${invertedDirections ? 'row' : 'column'}-${colIndex}-item-${rowIndex}`}
      {...additionalPressableProps}
    >
      {thumbnail.type === FileTypes.Video ? (
        <VideoThumbnail
          style={[
            imageBorderRadius ?? borderRadius,
            {
              height: thumbnail.height - 1,
              width: thumbnail.width - 1,
            },
            image,
          ]}
          thumb_url={thumbnail.thumb_url}
        />
      ) : (
        <View style={[styles.imageContainerStyle, imageContainerStyle]}>
          <GalleryImageThumbnail
            borderRadius={imageBorderRadius ?? borderRadius}
            ImageLoadingFailedIndicator={ImageLoadingFailedIndicator}
            ImageLoadingIndicator={ImageLoadingIndicator}
            ImageReloadIndicator={ImageReloadIndicator}
            thumbnail={thumbnail}
          />
        </View>
      )}
      {colIndex === numOfColumns - 1 && rowIndex === numOfRows - 1 && imagesAndVideos.length > 4 ? (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.moreImagesContainer,
            { backgroundColor: overlay },
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

  return (
    <View
      style={[
        {
          height: thumbnail.height - 1,
          width: thumbnail.width - 1,
        },
        gallery.thumbnail,
      ]}
    >
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
            style={[
              borderRadius,
              {
                height: thumbnail.height - 1,
                width: thumbnail.width - 1,
              },
              gallery.image,
            ]}
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
    groupStyles: prevGroupStyles,
    hasThreadReplies: prevHasThreadReplies,
    images: prevImages,
    message: prevMessage,
    myMessageTheme: prevMyMessageTheme,
    videos: prevVideos,
  } = prevProps;
  const {
    groupStyles: nextGroupStyles,
    hasThreadReplies: nextHasThreadReplies,
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

  const groupStylesEqual =
    prevGroupStyles.length === nextGroupStyles.length && prevGroupStyles[0] === nextGroupStyles[0];
  if (!groupStylesEqual) {
    return false;
  }

  const hasThreadRepliesEqual = prevHasThreadReplies === nextHasThreadReplies;
  if (!hasThreadRepliesEqual) {
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
    alignment: propAlignment,
    groupStyles: propGroupStyles,
    hasThreadReplies,
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
    setSelectedMessage: propSetSelectedMessage,
    threadList: propThreadList,
    videos: propVideos,
    VideoThumbnail: PropVideoThumbnail,
  } = props;

  const { setMessages, setSelectedMessage: contextSetSelectedMessage } = useImageGalleryContext();
  const {
    alignment: contextAlignment,
    groupStyles: contextGroupStyles,
    images: contextImages,
    message: contextMessage,
    onLongPress: contextOnLongPress,
    onPress: contextOnPress,
    onPressIn: contextOnPressIn,
    preventPress: contextPreventPress,
    threadList: contextThreadList,
    videos: contextVideos,
  } = useMessageContext();
  const {
    additionalPressableProps: contextAdditionalPressableProps,
    ImageLoadingFailedIndicator: ContextImageLoadingFailedIndicator,
    ImageLoadingIndicator: ContextImageLoadingIndicator,
    ImageReloadIndicator: ContextImageReloadIndicator,
    legacyImageViewerSwipeBehaviour,
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
  const alignment = propAlignment || contextAlignment;
  const groupStyles = propGroupStyles || contextGroupStyles;
  const onLongPress = propOnLongPress || contextOnLongPress;
  const onPressIn = propOnPressIn || contextOnPressIn;
  const onPress = propOnPress || contextOnPress;
  const preventPress =
    typeof propPreventPress === 'boolean' ? propPreventPress : contextPreventPress;
  const setSelectedMessage = propSetSelectedMessage || contextSetSelectedMessage;
  const setOverlay = propSetOverlay || contextSetOverlay;
  const threadList = propThreadList || contextThreadList;
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
        alignment,
        channelId: message?.cid,
        groupStyles,
        hasThreadReplies: hasThreadReplies || !!message?.reply_count,
        ImageLoadingFailedIndicator,
        ImageLoadingIndicator,
        ImageReloadIndicator,
        images,
        legacyImageViewerSwipeBehaviour,
        message,
        myMessageTheme,
        onLongPress,
        onPress,
        onPressIn,
        preventPress,
        setMessages,
        setOverlay,
        setSelectedMessage,
        threadList,
        videos,
        VideoThumbnail,
      }}
    />
  );
};

const styles = StyleSheet.create({
  errorTextSize: { fontSize: 10 },
  galleryContainer: {
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  imageContainer: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 1,
  },
  imageContainerStyle: { alignItems: 'center', flex: 1, justifyContent: 'center' },
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
    margin: 1,
  },
  moreImagesText: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
});

Gallery.displayName = 'Gallery{messageSimple{gallery}}';
