import React from 'react';
import {
  Modal,
  Image,
  TouchableOpacity,
  Text,
  SafeAreaView,
  View,
} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import PropTypes from 'prop-types';

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
            <Image
              source={{ uri: image.url }}
              style={{
                height: 200,
                width: 200,
              }}
            />
          </TouchableOpacity>
        ))}
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
        backgroundColor: '#ebebeb',
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
      <Text>X</Text>
    </TouchableOpacity>
  </View>
);
