import React, { useState } from 'react';
import {
  GestureResponderEvent,
  Image,
  Modal,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';

import CloseButton from '../CloseButton/CloseButton';

import { useMessageContentContext } from '../../contexts/messageContentContext/MessageContentContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { styled } from '../../styles/styledComponents';
import { themed } from '../../styles/theme';
import { makeImageCompatibleUrl } from '../../utils/utils';

import type { IImageInfo } from 'react-native-image-zoom-viewer/built/image-viewer.type';
import type { Attachment } from 'stream-chat';

import type { Alignment } from '../../contexts/messagesContext/MessagesContext';
import type { DefaultAttachmentType, UnknownType } from '../../types/types';

const Single = styled.TouchableOpacity<{ alignment: Alignment }>`
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  border-bottom-left-radius: ${({ alignment }) =>
    alignment === 'right' ? 16 : 2}px;
  border-bottom-right-radius: ${({ alignment }) =>
    alignment === 'left' ? 16 : 2}px;
  height: 200px;
  overflow: hidden;
  width: ${({ theme }) => theme.message.gallery.width}px;
  ${({ theme }) => theme.message.gallery.single.css}
`;

const GalleryContainer = styled.View<{
  alignment: Alignment;
  length?: number;
}>`
  border-radius: 16px;
  border-bottom-right-radius: ${({ alignment }) =>
    alignment === 'left' ? 16 : 2}px;
  border-bottom-left-radius: ${({ alignment }) =>
    alignment === 'right' ? 16 : 2}px;
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
  z-index: 1000;
  ${({ theme }) => theme.message.gallery.header.container.css}
`;

const HeaderButton = styled.TouchableOpacity`
  align-items: center;
  border-radius: 20px;
  height: 30px;
  justify-content: center;
  margin-right: 20px;
  margin-top: 20px;
  width: 30px;
  ${({ theme }) => theme.message.gallery.header.button.css}
`;

const GalleryHeader = ({
  handleDismiss,
}: {
  handleDismiss: ((event: GestureResponderEvent) => void) | undefined;
}) => (
  <HeaderContainer>
    <HeaderButton onPress={handleDismiss}>
      <CloseButton />
    </HeaderButton>
  </HeaderContainer>
);

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
const Gallery = <At extends UnknownType = DefaultAttachmentType>({
  alignment,
  images,
}: GalleryProps<At>) => {
  const { additionalTouchableProps, onLongPress } = useMessageContentContext();
  const { t } = useTranslationContext();

  const [viewerModalImageIndex, setViewerModalImageIndex] = useState(0);
  const [viewerModalOpen, setViewerModalOpen] = useState(false);

  if (!images?.length) return null;

  const unfilteredImages = [...images].map((image) => {
    const url = image.image_url || image.thumb_url;
    if (url) {
      return {
        url: makeImageCompatibleUrl(url),
      };
    }
    return undefined;
  });

  const galleryImages = unfilteredImages.filter(
    (image) => !!image,
  ) as IImageInfo[];

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
            source={{ uri: galleryImages[0]?.url }}
            style={{ flex: 1 }}
          />
        </Single>
        <Modal
          onRequestClose={() => setViewerModalOpen(false)}
          transparent={true}
          visible={viewerModalOpen}
        >
          <SafeAreaView style={{ backgroundColor: 'transparent', flex: 1 }}>
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
            />
          </SafeAreaView>
        </Modal>
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
                  source={{ uri: galleryImages[3]?.url }}
                  style={{ flex: 1 }}
                />
                <View
                  style={{
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.69)',
                    flex: 1,
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{ color: 'white', fontSize: 22, fontWeight: '700' }}
                  >
                    {' '}
                    +{' '}
                    {t('{{ imageCount }} more', {
                      imageCount: galleryImages.length - 3,
                    })}
                  </Text>
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
      <Modal
        onRequestClose={() => setViewerModalOpen(false)}
        transparent={true}
        visible={viewerModalOpen}
      >
        <SafeAreaView style={{ backgroundColor: 'transparent', flex: 1 }}>
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
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};

Gallery.themePath = 'message.gallery';

export default themed(Gallery) as typeof Gallery;
