import React from 'react';
import {
  Modal,
  Image,
  TouchableOpacity,
  SafeAreaView,
  View,
} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import closeRound from '../images/icons/close-round.png';

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

const GalleryHeader = ({ handleDismiss }) => (
  <View
    style={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      position: 'absolute',
      width: '100%',
      zIndex: 1000,
    }}
  >
    <TouchableOpacity
      onPress={handleDismiss}
      style={{
        width: 30,
        height: 30,
        marginRight: 20,
        marginTop: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
      }}
    >
      <X />
    </TouchableOpacity>
  </View>
);

const X = () => {
  const Container = styled.View`
    width: 30px;
    height: 30px;
    border-radius: 3px;
    align-items: center;
    justify-content: center;
    background-color: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
  `;

  return (
    <Container>
      <Image source={closeRound} />
    </Container>
  );
};
