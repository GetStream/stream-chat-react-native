import React, { useState } from 'react';
import {
  Image,
  ImageProps,
  PixelRatio,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
import { makeImageCompatibleUrl } from '../../utils/utils';

import type { MessageType } from '../../components/MessageList/hooks/useMessageList';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const GalleryImage: React.FC<
  Omit<ImageProps, 'height' | 'source'> & {
    height: number | string;
    uri: string;
  }
> = (props) => {
  const { height, uri, ...rest } = props;

  const [error, setError] = useState(false);

  return (
    <Image
      key={uri}
      {...rest}
      onError={() => setError(true)}
      source={{
        uri: uri.includes('&h=%2A')
          ? error
            ? uri
            : uri.replace('h=%2A', `h=${PixelRatio.getPixelSizeForLayoutSize(Number(height))}`)
          : uri,
      }}
      testID='image-attachment-single'
    />
  );
};

const MemoizedGalleryImage = React.memo(
  GalleryImage,
  (prevProps, nextProps) =>
    prevProps.height === nextProps.height && prevProps.uri === nextProps.uri,
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
  imageContainer: { flex: 1, padding: 1 },
  moreImagesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1,
  },
  moreImagesText: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
});

export type GalleryPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = Pick<ImageGalleryContextValue, 'setImage' | 'setImages'> &
  Pick<
    MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    | 'alignment'
    | 'groupStyles'
    | 'images'
    | 'onLongPress'
    | 'onPress'
    | 'onPressIn'
    | 'preventPress'
    | 'threadList'
  > &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'additionalTouchableProps' | 'legacyImageViewerSwipeBehaviour'
  > &
  Pick<OverlayContextValue, 'setBlurType' | 'setOverlay'> & {
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
     * TODO[major]: remove messageId and messageText
     * TODO: Fix circular dependencies of imports
     */
    message: MessageType<At, Ch, Co, Ev, Me, Re, Us>;
    hasThreadReplies?: boolean;
    messageId?: string;
    messageText?: string;
  };

const GalleryWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  props: GalleryPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    additionalTouchableProps,
    alignment,
    groupStyles,
    hasThreadReplies,
    images,
    legacyImageViewerSwipeBehaviour,
    message,
    messageId,
    messageText: messageTextProp,
    onLongPress,
    onPress,
    onPressIn,
    preventPress,
    setBlurType,
    setImage,
    setImages,
    setOverlay,
    threadList,
  } = props;

  const {
    theme: {
      colors: { overlay },
      imageGallery: { blurType },
      messageSimple: {
        gallery: {
          galleryContainer,
          galleryItemColumn,
          halfSize,
          image,
          imageContainer,
          moreImagesContainer,
          moreImagesText,
          size,
          width,
        },
      },
    },
  } = useTheme();

  if (!images?.length) return null;

  // [[{ height: number; url: string; }], [{ height: number; url: string; }, { height: number; url: string; }]]
  const galleryImages = images.slice(0, 4).reduce((returnArray, currentImage, index) => {
    const attachmentUrl = currentImage.image_url || currentImage.thumb_url;
    if (attachmentUrl) {
      const url = makeImageCompatibleUrl(attachmentUrl);
      if (images.length <= 2) {
        returnArray[0] = [...(returnArray[0] || []), { height: size || 200, url }];
      } else if (images.length === 3) {
        if (index === 0) {
          returnArray[0] = [{ height: size || 200, url }];
        } else {
          returnArray[1] = [...(returnArray[1] || []), { height: halfSize || 100, url }];
        }
      } else {
        returnArray[index % 2] = [
          ...(returnArray[index % 2] || []),
          { height: halfSize || 100, url },
        ];
      }
    }
    return returnArray;
  }, [] as { height: number | string; url: string }[][]);

  const groupStyle = `${alignment}_${groupStyles?.[0]?.toLowerCase?.()}`;
  const messageText = messageTextProp || message.text;

  return (
    <View
      style={[
        styles.galleryContainer,
        {
          width,
        },
        galleryContainer,
      ]}
      testID='image-multiple-container'
    >
      {galleryImages.map((column, colIndex) => (
        <View
          key={`gallery-item-column-${colIndex}`}
          style={[
            styles.flex,
            {
              flexDirection: images.length === 2 ? 'row' : 'column',
            },
            galleryItemColumn,
          ]}
        >
          {column.map(({ height, url }, rowIndex) => {
            const defaultOnPress = () => {
              if (!legacyImageViewerSwipeBehaviour) {
                setImages([message]);
              }
              setImage({ messageId: messageId || message.id, url });
              setBlurType(blurType);
              setOverlay('gallery');
            };

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={preventPress}
                key={`gallery-item-${url}/${rowIndex}/${images.length}`}
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
                  },
                  imageContainer,
                ]}
                testID='image-multiple'
                {...additionalTouchableProps}
              >
                <MemoizedGalleryImage
                  height={height}
                  resizeMode='cover'
                  style={[
                    styles.flex,
                    {
                      borderBottomLeftRadius:
                        (images.length === 1 ||
                          (images.length === 2 && rowIndex === 0) ||
                          (images.length === 3 && colIndex === 0 && rowIndex === 0) ||
                          (images.length === 4 && colIndex === 0 && rowIndex === 1)) &&
                        !messageText &&
                        ((groupStyle !== 'left_bottom' && groupStyle !== 'left_single') ||
                          (hasThreadReplies && !threadList))
                          ? 14
                          : 0,
                      borderBottomRightRadius:
                        (images.length === 1 ||
                          (colIndex === 1 && (images.length === 2 || rowIndex === 1))) &&
                        !messageText &&
                        ((groupStyle !== 'right_bottom' && groupStyle !== 'right_single') ||
                          (hasThreadReplies && !threadList))
                          ? 14
                          : 0,
                      borderTopLeftRadius: colIndex === 0 && rowIndex === 0 ? 14 : 0,
                      borderTopRightRadius:
                        ((colIndex === 1 || images.length === 1) && rowIndex === 0) ||
                        (images.length === 3 && colIndex === 0 && rowIndex === 1) ||
                        (images.length === 2 && rowIndex === 1)
                          ? 14
                          : 0,
                    },
                    image,
                  ]}
                  uri={url}
                />
                {colIndex === 1 && rowIndex === 1 && images.length > 3 ? (
                  <View
                    style={[
                      StyleSheet.absoluteFillObject,
                      styles.moreImagesContainer,
                      { backgroundColor: overlay },
                      moreImagesContainer,
                    ]}
                  >
                    <Text style={[styles.moreImagesText, moreImagesText]}>
                      {`+${images.length - 3}`}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  prevProps: GalleryPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: GalleryPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    groupStyles: prevGroupStyles,
    hasThreadReplies: prevHasThreadReplies,
    images: prevImages,
    messageText: prevMessageText,
  } = prevProps;
  const {
    groupStyles: nextGroupStyles,
    hasThreadReplies: nextHasThreadReplies,
    images: nextImages,
    messageText: nextMessageText,
  } = nextProps;

  const messageTextEqual = prevMessageText === nextMessageText;
  if (!messageTextEqual) return false;

  const groupStylesEqual =
    prevGroupStyles.length === nextGroupStyles.length && prevGroupStyles[0] === nextGroupStyles[0];
  if (!groupStylesEqual) return false;

  const hasThreadRepliesEqual = prevHasThreadReplies === nextHasThreadReplies;
  if (!hasThreadRepliesEqual) return false;

  const imagesEqual =
    prevImages.length === nextImages.length &&
    prevImages.every(
      (image, index) =>
        image.image_url === nextImages[index].image_url &&
        image.thumb_url === nextImages[index].thumb_url,
    );
  if (!imagesEqual) return false;

  return true;
};

const MemoizedGallery = React.memo(GalleryWithContext, areEqual) as typeof GalleryWithContext;

export type GalleryProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = Partial<GalleryPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

/**
 * UI component for card in attachments.
 */
export const Gallery = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  props: GalleryProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    additionalTouchableProps: propAdditionalTouchableProps,
    alignment: propAlignment,
    groupStyles: propGroupStyles,
    hasThreadReplies,
    images: propImages,
    messageId,
    messageText,
    onLongPress: propOnLongPress,
    onPress: propOnPress,
    onPressIn: propOnPressIn,
    preventPress: propPreventPress,
    setBlurType: propSetBlurType,
    setImage: propSetImage,
    setOverlay: propSetOverlay,
    threadList: propThreadList,
  } = props;

  const { setImage: contextSetImage, setImages } = useImageGalleryContext();
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
  } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    additionalTouchableProps: contextAdditionalTouchableProps,
    legacyImageViewerSwipeBehaviour,
  } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { setBlurType: contextSetBlurType, setOverlay: contextSetOverlay } = useOverlayContext();

  const images = propImages || contextImages;

  if (!images.length) return null;

  const additionalTouchableProps = propAdditionalTouchableProps || contextAdditionalTouchableProps;
  const alignment = propAlignment || contextAlignment;
  const groupStyles = propGroupStyles || contextGroupStyles;
  const onLongPress = propOnLongPress || contextOnLongPress;
  const onPressIn = propOnPressIn || contextOnPressIn;
  const onPress = propOnPress || contextOnPress;
  const preventPress =
    typeof propPreventPress === 'boolean' ? propPreventPress : contextPreventPress;
  const setBlurType = propSetBlurType || contextSetBlurType;
  const setImage = propSetImage || contextSetImage;
  const setOverlay = propSetOverlay || contextSetOverlay;
  const threadList = propThreadList || contextThreadList;

  return (
    <MemoizedGallery
      {...{
        additionalTouchableProps,
        alignment,
        groupStyles,
        hasThreadReplies: hasThreadReplies || !!message?.reply_count,
        images,
        legacyImageViewerSwipeBehaviour,
        message,
        messageId: messageId || message?.id,
        messageText: messageText || message?.text,
        onLongPress,
        onPress,
        onPressIn,
        preventPress,
        setBlurType,
        setImage,
        setImages,
        setOverlay,
        threadList,
      }}
    />
  );
};

Gallery.displayName = 'Gallery{messageSimple{gallery}}';
