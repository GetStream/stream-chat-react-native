import React from 'react';
import { FlatList } from 'react-native';
import { WithProgressIndicator } from './WithProgressIndicator';
import PropTypes from 'prop-types';
import { FileState, ProgressIndicatorTypes } from '../utils';
import styled from '@stream-io/styled-components';
import { themed } from '../styles/theme';

import closeRound from '../images/icons/close-round.png';

const Container = styled.View`
  height: ${({ theme }) =>
    theme.messageInput.imageUploadPreview.container.height};
  display: ${({ theme }) =>
    theme.messageInput.imageUploadPreview.container.display};
  padding: ${({ theme }) =>
    theme.messageInput.imageUploadPreview.container.padding}px;
  ${({ theme }) => theme.messageInput.imageUploadPreview.container.extra};
`;

const ItemContainer = styled.View`
  display: ${({ theme }) =>
    theme.messageInput.imageUploadPreview.itemContainer.display};
  height: ${({ theme }) =>
    theme.messageInput.imageUploadPreview.itemContainer.height};
  flex-direction: ${({ theme }) =>
    theme.messageInput.imageUploadPreview.itemContainer.flexDirection};
  align-items: ${({ theme }) =>
    theme.messageInput.imageUploadPreview.itemContainer.alignItems};
  margin-left: ${({ theme }) =>
    theme.messageInput.imageUploadPreview.itemContainer.marginLeft};
  ${({ theme }) => theme.messageInput.imageUploadPreview.itemContainer.extra};
`;

const Dismiss = styled.TouchableOpacity`
  position: ${({ theme }) =>
    theme.messageInput.imageUploadPreview.dismiss.position};
  top: ${({ theme }) => theme.messageInput.imageUploadPreview.dismiss.top};
  right: ${({ theme }) => theme.messageInput.imageUploadPreview.dismiss.right};
  background-color: ${({ theme }) =>
    theme.messageInput.imageUploadPreview.dismiss.backgroundColor};
  width: ${({ theme }) => theme.messageInput.imageUploadPreview.dismiss.width};
  height: ${({ theme }) =>
    theme.messageInput.imageUploadPreview.dismiss.height};
  display: ${({ theme }) =>
    theme.messageInput.imageUploadPreview.dismiss.display};
  align-items: ${({ theme }) =>
    theme.messageInput.imageUploadPreview.dismiss.alignItems};
  justify-content: ${({ theme }) =>
    theme.messageInput.imageUploadPreview.dismiss.justifyContent};
  border-radius: ${({ theme }) =>
    theme.messageInput.imageUploadPreview.dismiss.borderRadius};
  ${({ theme }) => theme.messageInput.imageUploadPreview.dismiss.extra};
`;

const Upload = styled.Image`
  width: ${({ theme }) => theme.messageInput.imageUploadPreview.upload.width};
  height: ${({ theme }) => theme.messageInput.imageUploadPreview.upload.height};
  border-radius: ${({ theme }) =>
    theme.messageInput.imageUploadPreview.upload.borderRadius};
  ${({ theme }) => theme.messageInput.imageUploadPreview.upload.extra};
`;

const DismissImage = styled.Image`
  width: ${({ theme }) =>
    theme.messageInput.imageUploadPreview.dismissImage.width};
  height: ${({ theme }) =>
    theme.messageInput.imageUploadPreview.dismissImage.height};
  ${({ theme }) => theme.messageInput.imageUploadPreview.dismissImage.extra};
`;

/**
 * ImageUploadPreview
 *
 * @example ./docs/ImageUploadPreview.md
 * @extends PureComponent
 */
export const ImageUploadPreview = themed(
  class ImageUploadPreview extends React.PureComponent {
    static themePath = 'messageInput.imageUploadPreview';
    constructor(props) {
      super(props);
    }
    static propTypes = {
      imageUploads: PropTypes.array.isRequired,
      removeImage: PropTypes.func,
      retryUpload: PropTypes.func,
    };

    _renderItem = ({ item }) => {
      let type;

      const { retryUpload } = this.props;

      if (item.state === FileState.UPLOADING)
        type = ProgressIndicatorTypes.IN_PROGRESS;

      if (item.state === FileState.UPLOAD_FAILED)
        type = ProgressIndicatorTypes.RETRY;
      return (
        <React.Fragment>
          <ItemContainer>
            <WithProgressIndicator
              active={item.state !== FileState.UPLOADED}
              type={type}
              action={retryUpload && retryUpload.bind(this, item.id)}
            >
              <Upload
                resizeMode="cover"
                source={{ uri: item.url || item.file.uri }}
              />
            </WithProgressIndicator>
            <Dismiss
              onPress={() => {
                this.props.removeImage(item.id);
              }}
            >
              <DismissImage source={closeRound} />
            </Dismiss>
          </ItemContainer>
        </React.Fragment>
      );
    };

    render() {
      if (!this.props.imageUploads || this.props.imageUploads.length === 0)
        return null;

      return (
        <Container theme={this.props.theme}>
          <FlatList
            horizontal
            style={{ flex: 1 }}
            data={this.props.imageUploads}
            keyExtractor={(item) => item.id}
            renderItem={this._renderItem}
          />
        </Container>
      );
    }
  },
);
