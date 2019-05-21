import React from 'react';
import { Text, View, Modal, Image, SafeAreaView } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { CloseButton } from './CloseButton';

const Single = styled.TouchableOpacity`
  display: ${(props) => props.theme.gallery.single.display};
  height: 200px;
  width: ${(props) => props.theme.gallery.single.maxWidth};
  border-top-left-radius: ${(props) => props.theme.gallery.single.borderRadius};
  border-top-right-radius: ${(props) =>
    props.theme.gallery.single.borderRadius};
  border-bottom-left-radius: ${(props) =>
    props.position === 'right' ? props.theme.gallery.single.borderRadius : 2};
  border-bottom-right-radius: ${(props) =>
    props.position === 'left' ? props.theme.gallery.single.borderRadius : 2};
  overflow: hidden;
`;

const GalleryContainer = styled.View`
  display: ${(props) => props.theme.gallery.galleryContainer.display};
  flex-direction: ${(props) => props.theme.gallery.flexDirection};
  flex-wrap: ${(props) => props.theme.gallery.flexWrap};
  width: ${(props) => props.theme.gallery.width};

  height: ${(props) =>
    props.length >= 4
      ? props.theme.gallery.doubleSize
      : props.length === 3
      ? props.theme.gallery.halfSize
      : props.theme.gallery.size};

  overflow: ${(props) => props.theme.gallery.galleryContainer.overflow};
  border-radius: ${(props) =>
    props.theme.gallery.galleryContainer.borderRadius};
  border-bottom-right-radius: ${(props) =>
    props.position === 'left'
      ? props.theme.gallery.galleryContainer.borderRadius
      : 2};
  border-bottom-left-radius: ${(props) =>
    props.position === 'right'
      ? props.theme.gallery.galleryContainer.borderRadius
      : 2};
`;

const ImageContainer = styled.TouchableOpacity`
  display: ${(props) => props.theme.gallery.imageContainer.display};
  height: ${(props) =>
    props.length !== 3
      ? props.theme.gallery.size
      : props.theme.gallery.halfSize};
  width: ${(props) =>
    props.length !== 3
      ? props.theme.gallery.size
      : props.theme.gallery.halfSize};
`;

export class Gallery extends React.PureComponent {
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
            position={this.props.position}
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
        <GalleryContainer length={images.length} position={this.props.position}>
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
}

const HeaderContainer = styled.View`
  display: ${(props) => props.theme.gallery.header.container.display};
  flex-direction: ${(props) =>
    props.theme.gallery.header.container.flexDirection};
  justify-content: ${(props) =>
    props.theme.gallery.header.container.justifyContent};
  position: ${(props) => props.theme.gallery.header.container.position};
  width: ${(props) => props.theme.gallery.header.container.width};
  z-index: ${(props) => props.theme.gallery.header.container.zIndex};
`;

const HeaderButton = styled.TouchableOpacity`
  width: ${(props) => props.theme.gallery.header.button.width};
  height: ${(props) => props.theme.gallery.header.button.height};
  margin-right: ${(props) => props.theme.gallery.header.button.marginRight};
  margin-top: ${(props) => props.theme.gallery.header.button.marginTop};
  display: ${(props) => props.theme.gallery.header.button.display};
  align-items: ${(props) => props.theme.gallery.header.button.alignItems};
  justify-content: ${(props) =>
    props.theme.gallery.header.button.justifyContent};
  border-radius: ${(props) => props.theme.gallery.header.button.borderRadius};
`;

const GalleryHeader = ({ handleDismiss }) => (
  <HeaderContainer>
    <HeaderButton onPress={handleDismiss}>
      <CloseButton />
    </HeaderButton>
  </HeaderContainer>
);
