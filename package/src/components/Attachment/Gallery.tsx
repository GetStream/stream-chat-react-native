import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { Attachment } from 'stream-chat';

import { GalleryImage } from './GallaryImage';
import { useLoadingImage } from './hooks/useLoadingImage';
import { buildGallery } from './utils/buildGallery/buildGallery';

import type { Thumbnail } from './utils/buildGallery/types';
import { getGalleryImageBorderRadius } from './utils/getGalleryImageBorderRadius';

import { openUrlSafely } from './utils/openUrlSafely';

import type { MessageType } from '../../components/MessageList/hooks/useMessageList';
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
import { isVideoPackageAvailable } from '../../native';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { getUrlWithoutParams } from '../../utils/utils';

const MemoizedGalleryImage = React.memo(
  GalleryImage,
  (prevProps, nextProps) =>
    getUrlWithoutParams(prevProps.uri) === getUrlWithoutParams(nextProps.uri),
) as typeof GalleryImage;

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
  imageLoadingIndicatorStyle: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  moreImagesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1,
  },
  moreImagesText: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
});

export type GalleryPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ImageGalleryContextValue<StreamChatGenerics>, 'setImage' | 'setImages'> &
  Pick<
    MessageContextValue<StreamChatGenerics>,
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
    MessagesContextValue<StreamChatGenerics>,
    | 'additionalTouchableProps'
    | 'legacyImageViewerSwipeBehaviour'
    | 'VideoThumbnail'
    | 'ImageLoadingIndicator'
    | 'ImageLoadingFailedIndicator'
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
     * here, but due to some circular dependencies within the SDK, it causes "exccesive deep nesting" issue with
     * typescript within Channel component. We should take it as a mini-project and resolve all these circular imports.
     *
     * TODO: Fix circular dependencies of imports
     */
    message?: MessageType<StreamChatGenerics>;
  };

const GalleryWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: GalleryPropsWithContext<StreamChatGenerics>,
) => {
  const {
    additionalTouchableProps,
    alignment,
    groupStyles,
    hasThreadReplies,
    ImageLoadingFailedIndicator,
    ImageLoadingIndicator,
    images,
    legacyImageViewerSwipeBehaviour,
    message,
    onLongPress,
    onPress,
    onPressIn,
    preventPress,
    setImage,
    setImages,
    setOverlay,
    threadList,
    videos,
    VideoThumbnail,
  } = props;

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
  const { height, invertedDirections, thumbnailGrid, width } = useMemo(
    () =>
      buildGallery({
        images: imagesAndVideos,
        sizeConfig,
      }),
    [imagesAndVideos.length],
  );

  if (!imagesAndVideos?.length) return null;
  const numOfColumns = thumbnailGrid.length;

  return (
    <View
      style={[
        styles.galleryContainer,
        {
          height,
          width,
        },
        galleryContainer,
        {
          flexDirection: invertedDirections ? 'column' : 'row',
        },
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
                  additionalTouchableProps={additionalTouchableProps}
                  borderRadius={borderRadius}
                  colIndex={colIndex}
                  ImageLoadingFailedIndicator={ImageLoadingFailedIndicator}
                  ImageLoadingIndicator={ImageLoadingIndicator}
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
                  setImage={setImage}
                  setImages={setImages}
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

type GalleryThumbnailProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  borderRadius: {
    borderBottomLeftRadius: number;
    borderBottomRightRadius: number;
    borderTopLeftRadius: number;
    borderTopRightRadius: number;
  };
  colIndex: number;
  imagesAndVideos: Attachment<StreamChatGenerics>[];
  invertedDirections: boolean;
  message: MessageType<StreamChatGenerics>;
  numOfColumns: number;
  numOfRows: number;
  rowIndex: number;
  thumbnail: Thumbnail;
} & Pick<
  MessagesContextValue<StreamChatGenerics>,
  | 'additionalTouchableProps'
  | 'legacyImageViewerSwipeBehaviour'
  | 'VideoThumbnail'
  | 'ImageLoadingIndicator'
  | 'ImageLoadingFailedIndicator'
> &
  Pick<ImageGalleryContextValue<StreamChatGenerics>, 'setImage' | 'setImages'> &
  Pick<
    MessageContextValue<StreamChatGenerics>,
    'onLongPress' | 'onPress' | 'onPressIn' | 'preventPress'
  > &
  Pick<OverlayContextValue, 'setOverlay'>;

const GalleryThumbnail = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  additionalTouchableProps,
  borderRadius,
  colIndex,
  ImageLoadingFailedIndicator,
  ImageLoadingIndicator,
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
  setImage,
  setImages,
  setOverlay,
  thumbnail,
  VideoThumbnail,
}: GalleryThumbnailProps<StreamChatGenerics>) => {
  const { isLoadingImage, isLoadingImageError, setLoadingImage, setLoadingImageError } =
    useLoadingImage();

  const {
    theme: {
      colors: { overlay },
      messageSimple: {
        gallery: { image, imageContainer, moreImagesContainer, moreImagesText },
      },
    },
  } = useTheme();

  const openImageViewer = () => {
    if (!legacyImageViewerSwipeBehaviour && message) {
      // Added if-else to keep the logic readable, instead of DRY.
      // if - legacyImageViewerSwipeBehaviour is disabled
      // else - legacyImageViewerSwipeBehaviour is enabled
      setImages([message]);
      setImage({ messageId: message.id, url: thumbnail.url });
      setOverlay('gallery');
    } else if (legacyImageViewerSwipeBehaviour) {
      setImage({ messageId: message?.id, url: thumbnail.url });
      setOverlay('gallery');
    }
  };

  const defaultOnPress = () => {
    if (thumbnail.type === 'video' && !isVideoPackageAvailable()) {
      // This condition is kinda unreachable, since we render videos as file attachment if the video
      // library is not installed. But doesn't hurt to have extra safeguard, in case of some customizations.
      openUrlSafely(thumbnail.url);
    } else {
      openImageViewer();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={preventPress}
      key={`gallery-item-${message.id}/${colIndex}/${rowIndex}/${imagesAndVideos.length}`}
      onLongPress={(event) => {
        if (onLongPress) {
          onLongPress({
            emitter: 'gallery',
            event,
          });
        }
      }}
      onPress={(event) => {
        if (onPress) {
          onPress({
            defaultHandler: defaultOnPress,
            emitter: 'gallery',
            event,
          });
        }
      }}
      onPressIn={(event) => {
        if (onPressIn) {
          onPressIn({
            defaultHandler: defaultOnPress,
            emitter: 'gallery',
            event,
          });
        }
      }}
      style={[
        styles.imageContainer,
        {
          height: thumbnail.height,
          width: thumbnail.width,
        },
        imageContainer,
      ]}
      testID={`gallery-${invertedDirections ? 'row' : 'column'}-${colIndex}-item-${rowIndex}`}
      {...additionalTouchableProps}
    >
      {thumbnail.type === 'video' ? (
        <VideoThumbnail
          style={[
            borderRadius,
            image,
            {
              height: thumbnail.height - 1,
              width: thumbnail.width - 1,
            },
          ]}
          thumb_url={thumbnail.thumb_url}
        />
      ) : (
        <View style={styles.imageContainerStyle}>
          <MemoizedGalleryImage
            onError={(error) => {
              console.warn(error);
              setLoadingImage(false);
              setLoadingImageError(true);
            }}
            onLoadEnd={() => setLoadingImage(false)}
            onLoadStart={() => setLoadingImage(true)}
            resizeMode={thumbnail.resizeMode}
            style={[
              borderRadius,
              image,
              {
                height: thumbnail.height - 1,
                width: thumbnail.width - 1,
              },
            ]}
            uri={thumbnail.url}
          />
          {isLoadingImage && (
            <View style={{ position: 'absolute' }}>
              <ImageLoadingIndicator style={styles.imageLoadingIndicatorStyle} />
            </View>
          )}
          {isLoadingImageError && (
            <View style={{ position: 'absolute' }}>
              <ImageLoadingFailedIndicator style={styles.imageLoadingIndicatorStyle} />
            </View>
          )}
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
            {`+${imagesAndVideos.length - 4}`}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: GalleryPropsWithContext<StreamChatGenerics>,
  nextProps: GalleryPropsWithContext<StreamChatGenerics>,
) => {
  const {
    groupStyles: prevGroupStyles,
    hasThreadReplies: prevHasThreadReplies,
    images: prevImages,
    message: prevMessage,
    videos: prevVideos,
  } = prevProps;
  const {
    groupStyles: nextGroupStyles,
    hasThreadReplies: nextHasThreadReplies,
    images: nextImages,
    message: nextMessage,
    videos: nextVideos,
  } = nextProps;

  const messageEqual = prevMessage?.id === nextMessage?.id;
  if (!messageEqual) return false;

  const groupStylesEqual =
    prevGroupStyles.length === nextGroupStyles.length && prevGroupStyles[0] === nextGroupStyles[0];
  if (!groupStylesEqual) return false;

  const hasThreadRepliesEqual = prevHasThreadReplies === nextHasThreadReplies;
  if (!hasThreadRepliesEqual) return false;

  const imagesEqual =
    prevImages.length === nextImages.length &&
    prevImages.every(
      (image, index) =>
        getUrlWithoutParams(image.image_url) === getUrlWithoutParams(nextImages[index].image_url) &&
        getUrlWithoutParams(image.thumb_url) === getUrlWithoutParams(nextImages[index].thumb_url),
    );
  if (!imagesEqual) return false;

  const videosEqual =
    prevVideos.length === nextVideos.length &&
    prevVideos.every(
      (image, index) =>
        getUrlWithoutParams(image.image_url) === getUrlWithoutParams(nextVideos[index].image_url) &&
        getUrlWithoutParams(image.thumb_url) === getUrlWithoutParams(nextVideos[index].thumb_url),
    );
  if (!videosEqual) return false;

  return true;
};

const MemoizedGallery = React.memo(GalleryWithContext, areEqual) as typeof GalleryWithContext;

export type GalleryProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<GalleryPropsWithContext<StreamChatGenerics>>;

/**
 * UI component for card in attachments.
 */
export const Gallery = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: GalleryProps<StreamChatGenerics>,
) => {
  const {
    additionalTouchableProps: propAdditionalTouchableProps,
    alignment: propAlignment,
    groupStyles: propGroupStyles,
    hasThreadReplies,
    ImageLoadingFailedIndicator: PropImageLoadingFailedIndicator,
    ImageLoadingIndicator: PropImageLoadingIndicator,
    images: propImages,
    onLongPress: propOnLongPress,
    onPress: propOnPress,
    onPressIn: propOnPressIn,
    preventPress: propPreventPress,
    setImage: propSetImage,
    setOverlay: propSetOverlay,
    threadList: propThreadList,
    videos: propVideos,
    VideoThumbnail: PropVideoThumbnail,
  } = props;

  const { setImage: contextSetImage, setImages } = useImageGalleryContext<StreamChatGenerics>();
  const {
    alignment: contextAlignment,
    groupStyles: contextGroupStyles,
    images: contextImages,
    message,
    onLongPress: contextOnLongPress,
    onPress: contextOnPress,
    onPressIn: contextOnPressIn,
    preventPress: contextPreventPress,
    threadList: contextThreadList,
    videos: contextVideos,
  } = useMessageContext<StreamChatGenerics>();
  const {
    additionalTouchableProps: contextAdditionalTouchableProps,
    ImageLoadingFailedIndicator: ContextImageLoadingFailedIndicator,
    ImageLoadingIndicator: ContextImageLoadingIndicator,
    legacyImageViewerSwipeBehaviour,
    VideoThumbnail: ContextVideoThumnbnail,
  } = useMessagesContext<StreamChatGenerics>();
  const { setOverlay: contextSetOverlay } = useOverlayContext();

  const images = propImages || contextImages;
  const videos = propVideos || contextVideos;

  if (!images.length && !videos.length) return null;

  const additionalTouchableProps = propAdditionalTouchableProps || contextAdditionalTouchableProps;
  const alignment = propAlignment || contextAlignment;
  const groupStyles = propGroupStyles || contextGroupStyles;
  const onLongPress = propOnLongPress || contextOnLongPress;
  const onPressIn = propOnPressIn || contextOnPressIn;
  const onPress = propOnPress || contextOnPress;
  const preventPress =
    typeof propPreventPress === 'boolean' ? propPreventPress : contextPreventPress;
  const setImage = propSetImage || contextSetImage;
  const setOverlay = propSetOverlay || contextSetOverlay;
  const threadList = propThreadList || contextThreadList;
  const VideoThumbnail = PropVideoThumbnail || ContextVideoThumnbnail;
  const ImageLoadingFailedIndicator =
    PropImageLoadingFailedIndicator || ContextImageLoadingFailedIndicator;
  const ImageLoadingIndicator = PropImageLoadingIndicator || ContextImageLoadingIndicator;

  return (
    <MemoizedGallery
      {...{
        additionalTouchableProps,
        alignment,
        channelId: message?.cid,
        groupStyles,
        hasThreadReplies: hasThreadReplies || !!message?.reply_count,
        ImageLoadingFailedIndicator,
        ImageLoadingIndicator,
        images,
        legacyImageViewerSwipeBehaviour,
        message,
        onLongPress,
        onPress,
        onPressIn,
        preventPress,
        setImage,
        setImages,
        setOverlay,
        threadList,
        videos,
        VideoThumbnail,
      }}
    />
  );
};

Gallery.displayName = 'Gallery{messageSimple{gallery}}';
