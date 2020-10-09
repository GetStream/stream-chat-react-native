import React, { useEffect, useState } from 'react';
import {
  GestureResponderEvent,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import { Immutable, isImmutable } from 'seamless-immutable';

import { CloseButton } from '../CloseButton/CloseButton';

import { useMessageContentContext } from '../../contexts/messageContentContext/MessageContentContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { styled } from '../../styles/styledComponents';
import { makeImageCompatibleUrl } from '../../utils/utils';

import type { IImageInfo } from 'react-native-image-zoom-viewer/built/image-viewer.type';
import type { Attachment } from 'stream-chat';

import type { Alignment } from '../../contexts/messagesContext/MessagesContext';
import type { DefaultAttachmentType, UnknownType } from '../../types/types';

const Single = styled.TouchableOpacity<{ alignment: Alignment }>`
  border-bottom-left-radius: ${({ alignment }) =>
    alignment === 'right' ? 16 : 2}px;
  border-bottom-right-radius: ${({ alignment }) =>
    alignment === 'left' ? 16 : 2}px;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  height: 200px;
  overflow: hidden;
  width: ${({ theme }) => theme.message.gallery.width}px;
  ${({ theme }) => theme.message.gallery.single.css}
`;

const GalleryContainer = styled.View<{
  alignment: Alignment;
  length?: number;
}>`
  border-bottom-left-radius: ${({ alignment }) =>
    alignment === 'right' ? 16 : 2}px;
  border-bottom-right-radius: ${({ alignment }) =>
    alignment === 'left' ? 16 : 2}px;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  flex-direction: row;
  flex-wrap: wrap;
  height: ${({ length, theme }) =>
    length && length >= 4
      ? theme.message.gallery.doubleSize
      : length === 3
      ? theme.message.gallery.halfSize
      : theme.message.gallery.size}px;
  overflow: hidden;
  width: ${({ theme }) => theme.message.gallery.width}px;
  ${({ theme }) => theme.message.gallery.galleryContainer.css}
`;

const ImageContainer = styled.TouchableOpacity<{ length?: number }>`
  height: ${({ length, theme }) =>
    length !== 3
      ? theme.message.gallery.size
      : theme.message.gallery.halfSize}px;
  width: ${({ length, theme }) =>
    length !== 3
      ? theme.message.gallery.size
      : theme.message.gallery.halfSize}px;
  ${({ theme }) => theme.message.gallery.imageContainer.css}
`;

const HeaderContainer = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  position: absolute;
  width: 100%;
  z-index: 1000;
  ${({ theme }) => theme.message.gallery.header.container.css}
`;

const HeaderButton = styled.TouchableOpacity`
  align-items: center;
  border-radius: 20px;
  height: 30px;
  justify-content: center;
  margin-right: 32px;
  margin-top: 32px;
  width: 30px;
  ${({ theme }) => theme.message.gallery.header.button.css}
`;

type GalleryHeaderProps = {
  handleDismiss: ((event: GestureResponderEvent) => void) | undefined;
};

const GalleryHeader: React.FC<GalleryHeaderProps> = ({ handleDismiss }) => {
  useEffect(() => {
    StatusBar.setHidden(true);
    return () => StatusBar.setHidden(false);
  }, []);

  return (
    <HeaderContainer>
      <HeaderButton onPress={handleDismiss}>
        <CloseButton />
      </HeaderButton>
    </HeaderContainer>
  );
};

export type GalleryProps<At extends UnknownType = DefaultAttachmentType> = {
  /**
   * Position of the message, either 'right' or 'left'
   */
  alignment: Alignment;
  /**
   * The image attachments to render
   */
  images: Attachment<At>[];
};

/**
 * UI component for card in attachments.
 *
 * @example ./Gallery.md
 */
export const Gallery = <At extends UnknownType = DefaultAttachmentType>(
  props: GalleryProps<At>,
) => {
  const { alignment, images } = props;
  const { additionalTouchableProps, onLongPress } = useMessageContentContext();
  const { t } = useTranslationContext();

  const [viewerModalImageIndex, setViewerModalImageIndex] = useState(0);
  const [viewerModalOpen, setViewerModalOpen] = useState(false);

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
      <>
        <Single
          alignment={alignment}
          onLongPress={onLongPress}
          onPress={() => setViewerModalOpen(true)}
          testID='image-attachment-single'
          {...additionalTouchableProps}
        >
          <Image
            resizeMode='cover'
            source={{ uri: galleryImages[0].url }}
            style={{ flex: 1 }}
          />
        </Single>
        {viewerModalOpen && (
          <Modal
            onRequestClose={() => setViewerModalOpen(false)}
            transparent
            visible
          >
            <ImageViewer
              // TODO: We don't have 'save image' functionality.
              // Until we do, lets disable this feature. saveToLocalByLongPress prop basically
              // opens up popup menu to with an option "Save to the album", which basically does nothing.
              enableSwipeDown
              imageUrls={galleryImages}
              onCancel={() => setViewerModalOpen(false)}
              renderHeader={() => (
                <GalleryHeader
                  handleDismiss={() => setViewerModalOpen(false)}
                />
              )}
              saveToLocalByLongPress={false}
              useNativeDriver
            />
          </Modal>
        )}
      </>
    );
  }

  return (
    <>
      <GalleryContainer
        alignment={alignment}
        length={galleryImages.length}
        testID='image-multiple-container'
      >
        {galleryImages.slice(0, 4).map((image, i) => (
          <ImageContainer
            activeOpacity={0.8}
            key={`gallery-item-${i}`}
            length={galleryImages.length}
            onLongPress={onLongPress}
            onPress={() => {
              setViewerModalOpen(true);
              setViewerModalImageIndex(i);
            }}
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
          </ImageContainer>
        ))}
      </GalleryContainer>
      {viewerModalOpen && (
        <Modal
          onRequestClose={() => setViewerModalOpen(false)}
          transparent
          visible
        >
          <ImageViewer
            // TODO: We don't have 'save image' functionality.
            // Until we do, lets disable this feature. saveToLocalByLongPress prop basically
            // opens up popup menu to with an option "Save to the album", which basically does nothing.
            enableSwipeDown
            imageUrls={galleryImages}
            index={viewerModalImageIndex}
            onCancel={() => setViewerModalOpen(false)}
            renderHeader={() => (
              <GalleryHeader handleDismiss={() => setViewerModalOpen(false)} />
            )}
            saveToLocalByLongPress={false}
            useNativeDriver
          />
        </Modal>
      )}
    </>
  );
};
