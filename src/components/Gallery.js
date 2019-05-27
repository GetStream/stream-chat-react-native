import React from 'react';
import { Text, View, Modal, Image, SafeAreaView } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { getTheme } from '../styles/theme';

import { CloseButton } from './CloseButton';

const Single = styled.TouchableOpacity`
  display: ${(props) => getTheme(props).gallery.single.display};
  height: 200px;
  width: ${(props) => getTheme(props).gallery.single.maxWidth};
  border-top-left-radius: ${(props) =>
    getTheme(props).gallery.single.borderRadius};
  border-top-right-radius: ${(props) =>
    getTheme(props).gallery.single.borderRadius};
  border-bottom-left-radius: ${(props) =>
    props.alignment === 'right'
      ? getTheme(props).gallery.single.borderRadius
      : 2};
  border-bottom-right-radius: ${(props) =>
    props.alignment === 'left'
      ? getTheme(props).gallery.single.borderRadius
      : 2};
  overflow: hidden;
`;

const GalleryContainer = styled.View`
  display: ${(props) => getTheme(props).gallery.galleryContainer.display};
  flex-direction: ${(props) => getTheme(props).gallery.flexDirection};
  flex-wrap: ${(props) => getTheme(props).gallery.flexWrap};
  width: ${(props) => getTheme(props).gallery.width};

  height: ${(props) =>
    props.length >= 4
      ? getTheme(props).gallery.doubleSize
      : props.length === 3
      ? getTheme(props).gallery.halfSize
      : getTheme(props).gallery.size};

  overflow: ${(props) => getTheme(props).gallery.galleryContainer.overflow};
  border-radius: ${(props) =>
    getTheme(props).gallery.galleryContainer.borderRadius};
  border-bottom-right-radius: ${(props) =>
    props.alignment === 'left'
      ? getTheme(props).gallery.galleryContainer.borderRadius
      : 2};
  border-bottom-left-radius: ${(props) =>
    props.alignment === 'right'
      ? getTheme(props).gallery.galleryContainer.borderRadius
      : 2};
`;

const ImageContainer = styled.TouchableOpacity`
  display: ${(props) => getTheme(props).gallery.imageContainer.display};
  height: ${(props) =>
    props.length !== 3
      ? getTheme(props).gallery.size
      : getTheme(props).gallery.halfSize};
  width: ${(props) =>
    props.length !== 3
      ? getTheme(props).gallery.size
      : getTheme(props).gallery.halfSize};
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
          <Modal
            visible={this.state.viewerModalOpen}
            transparent={true}
            onRequestClose={() => {}}
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
}

const HeaderContainer = styled.View`
  display: ${(props) => getTheme(props).gallery.header.container.display};
  flex-direction: ${(props) =>
    getTheme(props).gallery.header.container.flexDirection};
  justify-content: ${(props) =>
    getTheme(props).gallery.header.container.justifyContent};
  position: ${(props) => getTheme(props).gallery.header.container.position};
  width: ${(props) => getTheme(props).gallery.header.container.width};
  z-index: ${(props) => getTheme(props).gallery.header.container.zIndex};
`;

const HeaderButton = styled.TouchableOpacity`
  width: ${(props) => getTheme(props).gallery.header.button.width};
  height: ${(props) => getTheme(props).gallery.header.button.height};
  margin-right: ${(props) => getTheme(props).gallery.header.button.marginRight};
  margin-top: ${(props) => getTheme(props).gallery.header.button.marginTop};
  display: ${(props) => getTheme(props).gallery.header.button.display};
  align-items: ${(props) => getTheme(props).gallery.header.button.alignItems};
  justify-content: ${(props) =>
    getTheme(props).gallery.header.button.justifyContent};
  border-radius: ${(props) =>
    getTheme(props).gallery.header.button.borderRadius};
`;

const GalleryHeader = ({ handleDismiss }) => (
  <HeaderContainer>
    <HeaderButton onPress={handleDismiss}>
      <CloseButton />
    </HeaderButton>
  </HeaderContainer>
);
