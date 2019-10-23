import React from 'react';
import { Text, View, Modal, Image, SafeAreaView } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import PropTypes from 'prop-types';
import styled from '@stream-io/styled-components';
import { themed } from '../styles/theme';
import { withMessageContentContext } from '../context';
import { makeImageCompatibleUrl } from '../utils';

import { CloseButton } from './CloseButton';

const Single = styled.TouchableOpacity`
  display: flex;
  height: 200px;
  width: ${({ theme }) => theme.message.gallery.width};
  border-top-left-radius: 16;
  border-top-right-radius: 16;
  border-bottom-left-radius: ${({ alignment }) =>
    alignment === 'right' ? 16 : 2};
  border-bottom-right-radius: ${({ alignment }) =>
    alignment === 'left' ? 16 : 2};
  overflow: hidden;
  ${({ theme }) => theme.message.gallery.single.css}
`;

const GalleryContainer = styled.View`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: ${({ theme }) => theme.message.gallery.width};

  height: ${({ theme, length }) =>
    length >= 4
      ? theme.message.gallery.doubleSize
      : length === 3
      ? theme.message.gallery.halfSize
      : theme.message.gallery.size};

  overflow: hidden;
  border-radius: 16;
  border-bottom-right-radius: ${({ alignment }) =>
    alignment === 'left' ? 16 : 2};
  border-bottom-left-radius: ${({ alignment }) =>
    alignment === 'right' ? 16 : 2};
  ${({ theme }) => theme.message.gallery.galleryContainer.css}
`;

const ImageContainer = styled.TouchableOpacity`
  display: flex;
  height: ${({ theme, length }) =>
    length !== 3 ? theme.message.gallery.size : theme.message.gallery.halfSize};
  width: ${({ theme, length }) =>
    length !== 3 ? theme.message.gallery.size : theme.message.gallery.halfSize};
  ${({ theme }) => theme.message.gallery.imageContainer.css}
`;

export const Gallery = withMessageContentContext(
  themed(
    class Gallery extends React.PureComponent {
      static themePath = 'message.gallery';
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
        if (!this.props.images || this.props.images.length === 0) return null;

        const images = [...this.props.images].map((i) => ({
          url: makeImageCompatibleUrl(i.image_url || i.thumb_url),
        }));

        if (images.length === 1) {
          return (
            <React.Fragment>
              <Single
                onPress={() => {
                  this.setState({ viewerModalOpen: true });
                }}
                onLongPress={() => {
                  this.props.onLongPress();
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
                onRequestClose={() => {
                  this.setState({ viewerModalOpen: false });
                }}
              >
                <SafeAreaView
                  style={{ flex: 1, backgroundColor: 'transparent' }}
                >
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
                    this.setState({ viewerModalOpen: true });
                  }}
                  onLongPress={this.props.onLongPress}
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
              onRequestClose={() => {
                this.setState({ viewerModalOpen: false });
              }}
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
  ),
);

const HeaderContainer = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  position: absolute;
  width: 100%;
  z-index: 1000;
  ${({ theme }) => theme.message.gallery.header.container.css}
`;

const HeaderButton = styled.TouchableOpacity`
  width: 30;
  height: 30;
  margin-right: 20;
  margin-top: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20;
  ${({ theme }) => theme.message.gallery.header.button.css}
`;

const GalleryHeader = ({ handleDismiss }) => (
  <HeaderContainer>
    <HeaderButton onPress={handleDismiss}>
      <CloseButton />
    </HeaderButton>
  </HeaderContainer>
);
