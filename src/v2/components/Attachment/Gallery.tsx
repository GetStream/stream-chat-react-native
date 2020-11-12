import React, { useEffect } from 'react';
import {
  GestureResponderEvent,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Immutable, isImmutable } from 'seamless-immutable';

import { CloseButton } from '../CloseButton/CloseButton';

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
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';
import { makeImageCompatibleUrl } from '../../utils/utils';

import type { IImageInfo } from 'react-native-image-zoom-viewer/built/image-viewer.type';

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
  galleryContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  headerButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 30,
    justifyContent: 'center',
    marginRight: 32,
    marginTop: 32,
    width: 30,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    position: 'absolute',
    width: '100%',
    zIndex: 1000,
  },
  single: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: 200,
    overflow: 'hidden',
  },
});

type GalleryHeaderProps = {
  handleDismiss: ((event: GestureResponderEvent) => void) | undefined;
};

const GalleryHeader: React.FC<GalleryHeaderProps> = ({ handleDismiss }) => {
  const {
    theme: {
      messageSimple: {
        gallery: {
          header: { button, container },
        },
      },
    },
  } = useTheme();

  useEffect(() => {
    StatusBar.setHidden(true);
    return () => StatusBar.setHidden(false);
  }, []);

  return (
    <View style={[styles.headerContainer, container]}>
      <TouchableOpacity
        onPress={handleDismiss}
        style={[styles.headerButton, button]}
      >
        <CloseButton />
      </TouchableOpacity>
    </View>
  );
};

GalleryHeader.displayName = 'GalleryHeader{messageSimple{gallery{header}}}';

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
  'alignment' | 'images' | 'onLongPress'
> &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'additionalTouchableProps'
  > &
  Pick<TranslationContextValue, 't'> & {
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
    alignment,
    images,
    messageId,
    onLongPress,
    preventPress,
    t,
  } = props;

  const {
    theme: {
      messageSimple: {
        gallery: {
          doubleSize,
          galleryContainer,
          halfSize,
          imageContainer,
          single,
          size,
          width,
        },
      },
    },
  } = useTheme();
  const { setBlurType, setOverlay } = useOverlayContext();
  const { setImage } = useImageGalleryContext();

  if (!images?.length) return null;

  const immutableGalleryImages = images.reduce((returnArray, currentImage) => {
    const url = currentImage.image_url || currentImage.thumb_url;
    if (url) {
      returnArray.push({ url: makeImageCompatibleUrl(url) } as Immutable<
        IImageInfo
      >);
    }
    return returnArray;
  }, [] as Immutable<IImageInfo>[]);

  const galleryImages: IImageInfo[] = [];

  immutableGalleryImages.forEach((image) => {
    const galleryImage = isImmutable(image) ? image.asMutable() : image;
    galleryImages.push(galleryImage);
  });

  if (galleryImages.length === 1) {
    return (
      <TouchableOpacity
        disabled={preventPress}
        onLongPress={onLongPress}
        onPress={() => {
          setImage({ messageId, url: galleryImages[0].url });
          setBlurType('light');
          setOverlay('gallery');
        }}
        style={[
          styles.single,
          {
            borderBottomLeftRadius: alignment === 'right' ? 16 : 2,
            borderBottomRightRadius: alignment === 'left' ? 16 : 2,
            width,
          },
          single,
        ]}
        testID='image-attachment-single'
        {...additionalTouchableProps}
      >
        <Image
          resizeMode='cover'
          source={{ uri: galleryImages[0].url }}
          style={{ flex: 1 }}
        />
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.galleryContainer,
        {
          borderBottomLeftRadius: alignment === 'right' ? 16 : 2,
          borderBottomRightRadius: alignment === 'left' ? 16 : 2,
          height:
            galleryImages.length >= 4
              ? doubleSize
              : galleryImages.length === 3
              ? halfSize
              : size,
          width,
        },
        galleryContainer,
      ]}
      testID='image-multiple-container'
    >
      {galleryImages.slice(0, 4).map((image, i) => (
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={preventPress}
          key={`gallery-item-${i}`}
          onLongPress={onLongPress}
          onPress={() => {
            setImage({ messageId, url: galleryImages[i].url });
            setBlurType('light');
            setOverlay('gallery');
          }}
          style={[
            {
              height: galleryImages.length !== 3 ? size : halfSize,
              width: galleryImages.length !== 3 ? size : halfSize,
            },
            imageContainer,
          ]}
          testID='image-multiple'
          {...additionalTouchableProps}
        >
          {i === 3 && galleryImages.length > 4 ? (
            <View style={{ flex: 1 }}>
              <Image
                resizeMode='cover'
                source={{ uri: galleryImages[i].url }}
                style={{ flex: 1, opacity: 0.5 }}
              />
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { alignItems: 'center', justifyContent: 'center' },
                ]}
              >
                <View
                  style={{
                    alignItems: 'center',
                    backgroundColor: '#000000B0',
                    borderRadius: 20,
                    height: '40%',
                    justifyContent: 'center',
                    width: '90%',
                  }}
                >
                  <Text
                    style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}
                  >
                    +
                    {t('{{ imageCount }} more', {
                      imageCount: galleryImages.length - i,
                    })}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <Image
              resizeMode='cover'
              source={{ uri: image?.url }}
              style={{ flex: 1 }}
            />
          )}
        </TouchableOpacity>
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
    alignment: propAlignment,
    images: propImages,
    onLongPress: propOnLongPress,
    preventPress,
    t: propT,
  } = props;

  const {
    alignment: contextAlignment,
    images: contextImages,
    message,
    onLongPress: contextOnLongPress,
  } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    additionalTouchableProps: contextAdditionalTouchableProps,
  } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t: contextT } = useTranslationContext();

  const images = propImages || contextImages;

  if (!images.length) return null;

  const additionalTouchableProps =
    propAdditionalTouchableProps || contextAdditionalTouchableProps;
  const alignment = propAlignment || contextAlignment;
  const onLongPress = propOnLongPress || contextOnLongPress;
  const t = propT || contextT;

  return (
    <MemoizedGallery
      {...{
        additionalTouchableProps,
        alignment,
        images,
        messageId: message?.id,
        onLongPress,
        preventPress,
        t,
      }}
    />
  );
};

Gallery.displayName = 'Gallery{messageSimple{gallery}}';
