import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  },
  moreImagesText: { fontSize: 26, fontWeight: '700' },
});

export type GalleryPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<ImageGalleryContextValue, 'setImage'> &
  Pick<
    MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'alignment' | 'groupStyles' | 'images' | 'onLongPress'
  > &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'additionalTouchableProps'
  > &
  Pick<OverlayContextValue, 'setBlurType' | 'setOverlay'> & {
    messageId?: string;
    messageText?: string;
    preventPress?: boolean;
  };

const GalleryWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: GalleryPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    additionalTouchableProps,
    alignment,
    groupStyles,
    images,
    messageId,
    messageText,
    onLongPress,
    preventPress,
    setBlurType,
    setImage,
    setOverlay,
  } = props;

  const {
    theme: {
      imageGallery: { blurType },
      messageSimple: {
        content: {
          container: { borderRadiusL },
        },
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

  // [[{ url: string }], [{ url: string }, { url: string }]]
  const galleryImages = images
    .slice(0, 3)
    .reduce((returnArray, currentImage, index) => {
      const attachmentUrl = currentImage.image_url || currentImage.thumb_url;
      if (attachmentUrl) {
        const url = makeImageCompatibleUrl(attachmentUrl);
        Image.prefetch(url);
        if (images.length <= 2) {
          returnArray[0] = [
            ...(returnArray[0] || []),
            { height: size || 200, url },
          ];
        } else {
          if (index === 0) {
            returnArray[0] = [{ height: size || 200, url }];
          } else {
            returnArray[1] = [
              ...(returnArray[1] || []),
              { height: halfSize || 100, url },
            ];
          }
        }
      }
      return returnArray;
    }, [] as { height: number | string; url: string }[][]);

  const groupStyle = `${alignment}_${groupStyles[0].toLowerCase()}`;

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
          {column.map(({ height, url }, rowIndex) => (
            <TouchableOpacity
              activeOpacity={0.8}
              key={`gallery-item-${url}/${images.length}`}
              onLongPress={onLongPress}
              onPress={() => {
                if (!preventPress) {
                  setImage({ messageId, url });
                  setBlurType(blurType || 'light');
                  setOverlay('gallery');
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
              <Image
                resizeMode='cover'
                source={{ uri: url }}
                style={[
                  styles.flex,
                  {
                    borderBottomLeftRadius:
                      (images.length === 1 ||
                        (colIndex === 0 && rowIndex === 0)) &&
                      !messageText &&
                      groupStyle !== 'left_bottom' &&
                      groupStyle !== 'left_single'
                        ? borderRadiusL
                        : 0,
                    borderBottomRightRadius:
                      (images.length === 1 ||
                        (colIndex === 1 &&
                          (images.length === 2 || rowIndex === 1))) &&
                      !messageText &&
                      groupStyle !== 'right_bottom' &&
                      groupStyle !== 'right_single'
                        ? borderRadiusL
                        : 0,
                    borderTopLeftRadius:
                      colIndex === 0 && rowIndex === 0 ? 13 : 0,
                    borderTopRightRadius:
                      ((colIndex === 1 || images.length === 1) &&
                        rowIndex === 0) ||
                      (colIndex === 0 && rowIndex === 1)
                        ? 13
                        : 0,
                  },
                  image,
                ]}
              />
              {colIndex === 1 && rowIndex === 1 && images.length > 3 ? (
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    styles.moreImagesContainer,
                    moreImagesContainer,
                  ]}
                >
                  <Text style={[styles.moreImagesText, moreImagesText]}>
                    {`+${images.length - 3}`}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
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
  Us extends UnknownType = DefaultUserType
>(
  prevProps: GalleryPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: GalleryPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    groupStyles: prevGroupStyles,
    images: prevImages,
    messageText: prevMessageText,
  } = prevProps;
  const {
    groupStyles: nextGroupStyles,
    images: nextImages,
    messageText: nextMessageText,
  } = nextProps;

  const messageTextEqual = prevMessageText === nextMessageText;
  if (!messageTextEqual) return false;

  const groupStylesEqual =
    prevGroupStyles.length === nextGroupStyles.length &&
    prevGroupStyles[0] === nextGroupStyles[0];
  if (!groupStylesEqual) return false;

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

const MemoizedGallery = React.memo(
  GalleryWithContext,
  areEqual,
) as typeof GalleryWithContext;

export type GalleryProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<GalleryPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

/**
 * UI component for card in attachments.
 *
 * @example ./Gallery.md
 */
export const Gallery = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: GalleryProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    additionalTouchableProps: propAdditionalTouchableProps,
    alignment: propAlignment,
    groupStyles: propGroupStyles,
    images: propImages,
    messageId,
    messageText,
    onLongPress: propOnLongPress,
    preventPress,
    setBlurType: propSetBlurType,
    setImage: propSetImage,
    setOverlay: propSetOverlay,
  } = props;

  const { setImage: contextSetImage } = useImageGalleryContext();
  const {
    alignment: contextAlignment,
    groupStyles: contextGroupStyles,
    images: contextImages,
    message,
    onLongPress: contextOnLongPress,
  } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    additionalTouchableProps: contextAdditionalTouchableProps,
  } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    setBlurType: contextSetBlurType,
    setOverlay: contextSetOverlay,
  } = useOverlayContext();

  const images = propImages || contextImages;

  if (!images.length) return null;

  const additionalTouchableProps =
    propAdditionalTouchableProps || contextAdditionalTouchableProps;
  const alignment = propAlignment || contextAlignment;
  const groupStyles = propGroupStyles || contextGroupStyles;
  const onLongPress = propOnLongPress || contextOnLongPress;
  const setBlurType = propSetBlurType || contextSetBlurType;
  const setImage = propSetImage || contextSetImage;
  const setOverlay = propSetOverlay || contextSetOverlay;

  return (
    <MemoizedGallery
      {...{
        additionalTouchableProps,
        alignment,
        groupStyles,
        images,
        messageId: messageId || message?.id,
        messageText: messageText || message?.text,
        onLongPress,
        preventPress,
        setBlurType,
        setImage,
        setOverlay,
      }}
    />
  );
};

Gallery.displayName = 'Gallery{messageSimple{gallery}}';
