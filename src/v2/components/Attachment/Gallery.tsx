import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useImageGalleryContext } from '../../contexts/imageGalleryContext/ImageGalleryContext';
import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useOverlayContext } from '../../contexts/overlayContext/OverlayContext';
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
> = Pick<
  MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  'images' | 'onLongPress'
> &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'additionalTouchableProps'
  > & {
    messageId?: string;
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
    images,
    messageId,
    onLongPress,
    preventPress,
  } = props;

  const {
    theme: {
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
  const { setBlurType, setOverlay } = useOverlayContext();
  const { setImage } = useImageGalleryContext();

  if (!images?.length) return null;

  // [[{ url: string }], [{ url: string }, { url: string }]]
  const galleryImages = images
    .slice(0, 3)
    .reduce((returnArray, currentImage, index) => {
      const attachmentUrl = currentImage.image_url || currentImage.thumb_url;
      if (attachmentUrl) {
        const url = makeImageCompatibleUrl(attachmentUrl);
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
              key={`gallery-item-${url}`}
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
                source={{ cache: 'force-cache', uri: url }}
                style={[styles.flex, image]}
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
  const { images: prevImages } = prevProps;
  const { images: nextImages } = nextProps;

  const imagesEqual = prevImages.length === nextImages.length;

  return imagesEqual;
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
    images: propImages,
    onLongPress: propOnLongPress,
    preventPress,
  } = props;

  const {
    images: contextImages,
    message,
    onLongPress: contextOnLongPress,
  } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    additionalTouchableProps: contextAdditionalTouchableProps,
  } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();

  const images = propImages || contextImages;

  if (!images.length) return null;

  const additionalTouchableProps =
    propAdditionalTouchableProps || contextAdditionalTouchableProps;
  const onLongPress = propOnLongPress || contextOnLongPress;

  return (
    <MemoizedGallery
      {...{
        additionalTouchableProps,
        images,
        messageId: message?.id,
        onLongPress,
        preventPress,
      }}
    />
  );
};

Gallery.displayName = 'Gallery{messageSimple{gallery}}';
