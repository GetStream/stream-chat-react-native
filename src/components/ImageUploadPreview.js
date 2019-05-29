import React from 'react';
import { FlatList } from 'react-native';
import { UploadProgressIndicator } from './UploadProgressIndicator';
import PropTypes from 'prop-types';
import { FileState, ProgressIndicatorTypes } from '../utils';
import styled from '@stream-io/styled-components';
import { themed } from '../styles/theme';

import closeRound from '../images/icons/close-round.png';

const Container = styled.View`
  height: 70;
  display: flex;
  padding: 10px;
  ${({ theme }) => theme.messageInput.imageUploadPreview.container.css};
`;

const ItemContainer = styled.View`
  display: flex;
  height: 50;
  flex-direction: row;
  align-items: flex-start;
  margin-left: 5;
  ${({ theme }) => theme.messageInput.imageUploadPreview.itemContainer.css};
`;

const Dismiss = styled.TouchableOpacity`
  position: absolute;
  top: 5;
  right: 5;
  background-color: #fff;
  width: 20;
  height: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20;
  ${({ theme }) => theme.messageInput.imageUploadPreview.dismiss.css};
`;

const Upload = styled.Image`
  width: 50;
  height: 50;
  border-radius: 10;
  ${({ theme }) => theme.messageInput.imageUploadPreview.upload.css};
`;

const DismissImage = styled.Image`
  width: 10;
  height: 10;
  ${({ theme }) => theme.messageInput.imageUploadPreview.dismissImage.css};
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
            <UploadProgressIndicator
              active={item.state !== FileState.UPLOADED}
              type={type}
              action={retryUpload && retryUpload.bind(this, item.id)}
            >
              <Upload
                resizeMode="cover"
                source={{ uri: item.url || item.file.uri }}
              />
            </UploadProgressIndicator>
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
