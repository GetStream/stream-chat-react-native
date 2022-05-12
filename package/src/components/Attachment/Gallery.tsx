import React, { useMemo } from 'react';
import { Image, ImageProps, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { buildGallery } from './utils/buildGallery/buildGallery';

import { getGalleryImageBorderRadius } from './utils/getGalleryImageBorderRadius';

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
import type { DefaultStreamChatGenerics } from '../../types/types';
import { getUrlWithoutParams, makeImageCompatibleUrl } from '../../utils/utils';

const GalleryImage: React.FC<
  Omit<ImageProps, 'height' | 'source'> & {
    uri: string;
  }
> = (props) => {
  const { uri, ...rest } = props;

  return (
    <Image
      {...rest}
      source={{
        uri: makeImageCompatibleUrl(uri),
      }}
      testID='image-attachment-single'
    />
  );
};

const MemoizedGalleryImage = React.memo(
  GalleryImage,
  (prevProps, nextProps) =>
    getUrlWithoutParams(prevProps.uri) === getUrlWithoutParams(nextProps.uri),
) as typeof GalleryImage;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  galleryContainer: {
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  imageContainer: { display: 'flex', flexDirection: 'row', justifyContent: 'center', padding: 1 },
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
    | 'imagesAndVideos'
    | 'onLongPress'
    | 'onPress'
    | 'onPressIn'
    | 'preventPress'
    | 'threadList'
  > &
  Pick<
    MessagesContextValue<StreamChatGenerics>,
    'additionalTouchableProps' | 'legacyImageViewerSwipeBehaviour' | 'VideoThumbnail'
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
    imagesAndVideos,
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
    VideoThumbnail,
  } = props;

  const {
    theme: {
      colors: { overlay },
      messageSimple: {
        gallery: {
          galleryContainer,
          galleryItemColumn,
          gridHeight,
          gridWidth,
          image,
          imageContainer,
          maxHeight,
          maxWidth,
          minHeight,
          minWidth,
          moreImagesContainer,
          moreImagesText,
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

  const { height, invertedDirections, thumbnailGrid, width } = useMemo(
    () =>
      buildGallery({
        images: imagesAndVideos,
        sizeConfig,
      }),
    [imagesAndVideos.length],
  );

  if (!imagesAndVideos?.length) return null;
  const messageText = message?.text;
  const messageId = message?.id;
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
            {rows.map(({ height, resizeMode, type, url, width }, rowIndex) => {
              const defaultOnPress = () => {
                // Added if-else to keep the logic readable, instead of DRY.
                // if - legacyImageViewerSwipeBehaviour is disabled
                // else - legacyImageViewerSwipeBehaviour is enabled
                if (!legacyImageViewerSwipeBehaviour && message) {
                  setImages([message]);
                  setImage({ messageId: message.id, url });
                  setOverlay('gallery');
                } else if (legacyImageViewerSwipeBehaviour) {
                  setImage({ messageId: message?.id, url });
                  setOverlay('gallery');
                }
              };
              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={preventPress}
                  key={`gallery-item-${messageId}/${colIndex}/${rowIndex}/${imagesAndVideos.length}`}
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
                      height,
                      width,
                    },
                    imageContainer,
                  ]}
                  testID={`gallery-${
                    invertedDirections ? 'row' : 'column'
                  }-${colIndex}-item-${rowIndex}`}
                  {...additionalTouchableProps}
                >
                  {type === 'video' ? (
                    <VideoThumbnail
                      style={[
                        getGalleryImageBorderRadius({
                          alignment,
                          colIndex,
                          groupStyles,
                          hasThreadReplies,
                          height,
                          invertedDirections,
                          messageText,
                          numOfColumns,
                          numOfRows,
                          rowIndex,
                          sizeConfig,
                          threadList,
                          width,
                        }),
                        image,
                        {
                          height: height - 1,
                          width: width - 1,
                        },
                      ]}
                    />
                  ) : (
                    <MemoizedGalleryImage
                      resizeMode={resizeMode}
                      style={[
                        getGalleryImageBorderRadius({
                          alignment,
                          colIndex,
                          groupStyles,
                          hasThreadReplies,
                          height,
                          invertedDirections,
                          messageText,
                          numOfColumns,
                          numOfRows,
                          rowIndex,
                          sizeConfig,
                          threadList,
                          width,
                        }),
                        image,
                        {
                          height: height - 1,
                          width: width - 1,
                        },
                      ]}
                      uri={url}
                    />
                  )}
                  {colIndex === numOfColumns - 1 &&
                  rowIndex === numOfRows - 1 &&
                  imagesAndVideos.length > 4 ? (
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
            })}
          </View>
        );
      })}
    </View>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: GalleryPropsWithContext<StreamChatGenerics>,
  nextProps: GalleryPropsWithContext<StreamChatGenerics>,
) => {
  const {
    groupStyles: prevGroupStyles,
    hasThreadReplies: prevHasThreadReplies,
    imagesAndVideos: prevImagesAndVideos,
    message: prevMessage,
  } = prevProps;
  const {
    groupStyles: nextGroupStyles,
    hasThreadReplies: nextHasThreadReplies,
    imagesAndVideos: nextImagesAndVideos,
    message: nextMessage,
  } = nextProps;

  const messageEqual = prevMessage?.id === nextMessage?.id;
  if (!messageEqual) return false;

  const groupStylesEqual =
    prevGroupStyles.length === nextGroupStyles.length && prevGroupStyles[0] === nextGroupStyles[0];
  if (!groupStylesEqual) return false;

  const hasThreadRepliesEqual = prevHasThreadReplies === nextHasThreadReplies;
  if (!hasThreadRepliesEqual) return false;

  const imagesEqual =
    prevImagesAndVideos.length === nextImagesAndVideos.length &&
    prevImagesAndVideos.every(
      (image, index) =>
        getUrlWithoutParams(image.image_url) ===
          getUrlWithoutParams(nextImagesAndVideos[index].image_url) &&
        getUrlWithoutParams(image.thumb_url) ===
          getUrlWithoutParams(nextImagesAndVideos[index].thumb_url),
    );
  if (!imagesEqual) return false;

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
    imagesAndVideos: propImagesAndVideos,
    onLongPress: propOnLongPress,
    onPress: propOnPress,
    onPressIn: propOnPressIn,
    preventPress: propPreventPress,
    setImage: propSetImage,
    setOverlay: propSetOverlay,
    threadList: propThreadList,
    VideoThumbnail: PropVideoThumbnail,
  } = props;

  const { setImage: contextSetImage, setImages } = useImageGalleryContext<StreamChatGenerics>();
  const {
    alignment: contextAlignment,
    groupStyles: contextGroupStyles,
    imagesAndVideos: contextImagesAndVideos,
    message,
    onLongPress: contextOnLongPress,
    onPress: contextOnPress,
    onPressIn: contextOnPressIn,
    preventPress: contextPreventPress,
    threadList: contextThreadList,
  } = useMessageContext<StreamChatGenerics>();
  const {
    additionalTouchableProps: contextAdditionalTouchableProps,
    legacyImageViewerSwipeBehaviour,
    VideoThumbnail: ContextVideoThumnbnail,
  } = useMessagesContext<StreamChatGenerics>();
  const { setOverlay: contextSetOverlay } = useOverlayContext();

  const imagesAndVideos = propImagesAndVideos || contextImagesAndVideos;

  if (!imagesAndVideos.length) return null;

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

  return (
    <MemoizedGallery
      {...{
        additionalTouchableProps,
        alignment,
        channelId: message?.cid,
        groupStyles,
        hasThreadReplies: hasThreadReplies || !!message?.reply_count,
        imagesAndVideos,
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
        VideoThumbnail,
      }}
    />
  );
};

Gallery.displayName = 'Gallery{messageSimple{gallery}}';
