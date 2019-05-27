import React from 'react';
import { Text, View, Modal, Image, SafeAreaView } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import PropTypes from 'prop-types';
import styled from '@stream-io/styled-components';
import { themed } from '../styles/theme';

import { CloseButton } from './CloseButton';

const Single = styled.TouchableOpacity`
  display: ${({ theme }) => theme.gallery.single.display};
  height: 200px;
  width: ${({ theme }) => theme.gallery.single.maxWidth};
  border-top-left-radius: ${({ theme }) => theme.gallery.single.borderRadius};
  border-top-right-radius: ${({ theme }) => theme.gallery.single.borderRadius};
  border-bottom-left-radius: ${({ theme, alignment }) =>
    alignment === 'right' ? theme.gallery.single.borderRadius : 2};
  border-bottom-right-radius: ${({ theme, alignment }) =>
    alignment === 'left' ? theme.gallery.single.borderRadius : 2};
  overflow: hidden;
  ${({ theme }) => theme.gallery.single.extra}
`;

const GalleryContainer = styled.View`
  display: ${({ theme }) => theme.gallery.galleryContainer.display};
  flex-direction: ${({ theme }) => theme.gallery.flexDirection};
  flex-wrap: ${({ theme }) => theme.gallery.flexWrap};
  width: ${({ theme }) => theme.gallery.width};

  height: ${({ theme, length }) =>
    length >= 4
      ? theme.gallery.doubleSize
      : length === 3
      ? theme.gallery.halfSize
      : theme.gallery.size};

  overflow: ${({ theme }) => theme.gallery.galleryContainer.overflow};
  border-radius: ${({ theme }) => theme.gallery.galleryContainer.borderRadius};
  border-bottom-right-radius: ${({ theme, alignment }) =>
    alignment === 'left' ? theme.gallery.galleryContainer.borderRadius : 2};
  border-bottom-left-radius: ${({ theme, alignment }) =>
    alignment === 'right' ? theme.gallery.galleryContainer.borderRadius : 2};
  ${({ theme }) => theme.gallery.galleryContainer.extra}
`;

const ImageContainer = styled.TouchableOpacity`
  display: ${({ theme }) => theme.gallery.imageContainer.display};
  height: ${({ theme, length }) =>
    length !== 3 ? theme.gallery.size : theme.gallery.halfSize};
  width: ${({ theme, length }) =>
    length !== 3 ? theme.gallery.size : theme.gallery.halfSize};
  ${({ theme }) => theme.gallery.imageContainer.extra}
`;

export const Gallery = themed(
  class Gallery extends React.PureComponent {
    static themePath = 'gallery';
    static propTypes = {
      /** The images to render */
      images: PropTypes.arrayOf(
        PropTypes.shape({
          image_url: PropTypes.string,
          thumb_url: PropTypes.string,
        }),
      ),
    };

    constructor(props) {
      super(props);
      this.state = {
        viewerModalOpen: false,
      };
    }

    render() {
      const images = [...this.props.images].map((i) => ({
        url: i.image_url || i.thumb_url,
      }));

      if (images.length === 1) {
        return (
          <React.Fragment>
            <Single
              onPress={() => {
                this.setState({ viewerModalOpen: true });
              }}
              alignment={this.props.alignment}
            >
              <Image
                style={{
                  width: 100 + '%',
                  height: 100 + '%',
                }}
                resizeMode="cover"
                source={{ uri: images[0].url }}
              />
            </Single>
            <Modal visible={this.state.viewerModalOpen} transparent={true}>
              <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
                <ImageViewer
                  imageUrls={images}
                  onCancel={() => {
                    this.setState({ viewerModalOpen: false });
                  }}
                  enableSwipeDown
                  renderHeader={() => (
                    <GalleryHeader
                      handleDismiss={() => {
                        this.setState({ viewerModalOpen: false });
                      }}
                    />
                  )}
                />
              </SafeAreaView>
            </Modal>
          </React.Fragment>
        );
      }

      return (
        <React.Fragment>
          <GalleryContainer
            length={images.length}
            alignment={this.props.alignment}
          >
            {images.slice(0, 4).map((image, i) => (
              <ImageContainer
                key={`gallery-item-${i}`}
                length={images.length}
                activeOpacity={0.8}
                onPress={() => {
                  console.log('open');
                  this.setState({ viewerModalOpen: true });
                }}
              >
                {i === 3 && images.length > 4 ? (
                  <View
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    <Image
                      style={{
                        width: 100 + '%',
                        height: 100 + '%',
                      }}
                      resizeMode="cover"
                      source={{ uri: images[3].url }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.69)',
                      }}
                    >
                      <Text
                        style={{
                          color: 'white',
                          fontWeight: '700',
                          fontSize: 22,
                        }}
                      >
                        {' '}
                        + {images.length - 3} more
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Image
                    style={{
                      width: 100 + '%',
                      height: 100 + '%',
                    }}
                    resizeMode="cover"
                    source={{ uri: image.url }}
                  />
                )}
              </ImageContainer>
            ))}
          </GalleryContainer>
          <Modal
            onRequestClose={() => {}}
            visible={this.state.viewerModalOpen}
            transparent={true}
          >
            <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
              <ImageViewer
                imageUrls={images}
                onCancel={() => {
                  this.setState({ viewerModalOpen: false });
                }}
                enableSwipeDown
                renderHeader={() => (
                  <GalleryHeader
                    handleDismiss={() => {
                      this.setState({ viewerModalOpen: false });
                    }}
                  />
                )}
              />
            </SafeAreaView>
          </Modal>
        </React.Fragment>
      );
    }
  },
);

const HeaderContainer = styled.View`
  display: ${({ theme }) => theme.gallery.header.container.display};
  flex-direction: ${({ theme }) =>
    theme.gallery.header.container.flexDirection};
  justify-content: ${({ theme }) =>
    theme.gallery.header.container.justifyContent};
  position: ${({ theme }) => theme.gallery.header.container.position};
  width: ${({ theme }) => theme.gallery.header.container.width};
  z-index: ${({ theme }) => theme.gallery.header.container.zIndex};
  ${({ theme }) => theme.gallery.header.container.extra}
`;

const HeaderButton = styled.TouchableOpacity`
  width: ${({ theme }) => theme.gallery.header.button.width};
  height: ${({ theme }) => theme.gallery.header.button.height};
  margin-right: ${({ theme }) => theme.gallery.header.button.marginRight};
  margin-top: ${({ theme }) => theme.gallery.header.button.marginTop};
  display: ${({ theme }) => theme.gallery.header.button.display};
  align-items: ${({ theme }) => theme.gallery.header.button.alignItems};
  justify-content: ${({ theme }) => theme.gallery.header.button.justifyContent};
  border-radius: ${({ theme }) => theme.gallery.header.button.borderRadius};
  ${({ theme }) => theme.gallery.header.button.extra}
`;

const GalleryHeader = ({ handleDismiss }) => (
  <HeaderContainer>
    <HeaderButton onPress={handleDismiss}>
      <CloseButton />
    </HeaderButton>
  </HeaderContainer>
);
