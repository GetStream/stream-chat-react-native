import React from 'react';
import { Modal, Image, TouchableOpacity, SafeAreaView } from 'react-native';
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
        {images.map((image, i) => (
          <TouchableOpacity
            key={`gallery-image-${i}`}
            activeOpacity={0.8}
            onPress={() => {
              this.setState({ viewerModalOpen: true });
            }}
          >
            <Image source={{ uri: image.url }} />
          </TouchableOpacity>
        ))}
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
