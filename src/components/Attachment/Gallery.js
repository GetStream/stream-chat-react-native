import React, { useContext, useState } from 'react';
import { Image, Modal, SafeAreaView, Text, View } from 'react-native';
import PropTypes from 'prop-types';
import ImageViewer from 'react-native-image-zoom-viewer';
import styled from 'styled-components/native';

import CloseButton from '../CloseButton/CloseButton';

import { MessageContentContext, TranslationContext } from '../../context';
import { themed } from '../../styles/theme';
import { makeImageCompatibleUrl } from '../../utils/utils';

const Single = styled.TouchableOpacity`
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

const GalleryContainer = styled.View`
  border-radius: 16px;
  border-bottom-right-radius: ${({ alignment }) =>
    alignment === 'left' ? 16 : 2}px;
  border-bottom-left-radius: ${({ alignment }) =>
    alignment === 'right' ? 16 : 2}px;
  flex-direction: row;
  flex-wrap: wrap;
  height: ${({ theme, length }) =>
    length >= 4
      ? theme.message.gallery.doubleSize
      : length === 3
      ? theme.message.gallery.halfSize
      : theme.message.gallery.size}px;
  overflow: hidden;
  width: ${({ theme }) => theme.message.gallery.width}px;
  ${({ theme }) => theme.message.gallery.galleryContainer.css}
`;

const ImageContainer = styled.TouchableOpacity`
  height: ${({ theme, length }) =>
    length !== 3
      ? theme.message.gallery.size
      : theme.message.gallery.halfSize}px;
  width: ${({ theme, length }) =>
    length !== 3
      ? theme.message.gallery.size
      : theme.message.gallery.halfSize}px;
  ${({ theme }) => theme.message.gallery.imageContainer.css}
`;

const HeaderContainer = styled.View`
  flex: 1;
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

const GalleryHeader = ({ handleDismiss }) => (
  <HeaderContainer>
    <HeaderButton onPress={handleDismiss}>
      <CloseButton />
    </HeaderButton>
  </HeaderContainer>
);

/**
 * UI component for card in attachments.
 *
 * @example ../docs/Gallery.md
 */
const Gallery = ({ alignment, images }) => {
  const { additionalTouchableProps, onLongPress } = useContext(
    MessageContentContext,
  );
  const { t } = useContext(TranslationContext);

  const [viewerModalImageIndex, setViewerModalImageIndex] = useState(0);
  const [viewerModalOpen, setViewerModalOpen] = useState(false);

  if (!images || !images.length) return null;

  const galleryImages = [...images].map((image) => ({
    url: makeImageCompatibleUrl(image.image_url || image.thumb_url),
  }));

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
      <GalleryContainer alignment={alignment} length={galleryImages.length}>
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
            {...additionalTouchableProps}
          >
            {i === 3 && galleryImages.length > 4 ? (
              <View style={{ flex: 1 }}>
                <Image
                  resizeMode='cover'
                  source={{ uri: galleryImages[3].url }}
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
                source={{ uri: image.url }}
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

Gallery.propTypes = {
  /**
   * Provide any additional props for child `TouchableOpacity`.
   * Please check docs for TouchableOpacity for supported props - https://reactnative.dev/docs/touchableopacity#props
   */
  additionalTouchableProps: PropTypes.object,
  alignment: PropTypes.string,
  /** The images to render */
  images: PropTypes.arrayOf(
    PropTypes.shape({
      image_url: PropTypes.string,
      thumb_url: PropTypes.string,
    }),
  ),
  onLongPress: PropTypes.func,
};

Gallery.themePath = 'message.gallery';

export default themed(Gallery);
