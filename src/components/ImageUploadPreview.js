import React from 'react';
import { FlatList } from 'react-native';
import { WithProgressIndicator } from './WithProgressIndicator';
import PropTypes from 'prop-types';
import { FileState, ProgressIndicatorTypes } from '../utils';
import styled from '@stream-io/styled-components';

import closeRound from '../images/icons/close-round.png';

const Container = styled.View`
  height: ${({ theme }) => theme.imageUploadPreview.container.height};
  display: ${({ theme }) => theme.imageUploadPreview.container.display};
  padding: ${({ theme }) => theme.imageUploadPreview.container.padding}px;
`;

const ItemContainer = styled.View`
  display: ${({ theme }) => theme.imageUploadPreview.itemContainer.display};
  height: ${({ theme }) => theme.imageUploadPreview.itemContainer.height};
  flex-direction: ${({ theme }) =>
    theme.imageUploadPreview.itemContainer.flexDirection};
  align-items: ${({ theme }) =>
    theme.imageUploadPreview.itemContainer.alignItems};
  margin-left: ${({ theme }) =>
    theme.imageUploadPreview.itemContainer.marginLeft};
`;

const Dismiss = styled.TouchableOpacity`
  position: ${({ theme }) => theme.imageUploadPreview.dismiss.position};
  top: ${({ theme }) => theme.imageUploadPreview.dismiss.top};
  right: ${({ theme }) => theme.imageUploadPreview.dismiss.right};
  background-color: ${({ theme }) =>
    theme.imageUploadPreview.dismiss.backgroundColor};
  width: ${({ theme }) => theme.imageUploadPreview.dismiss.width};
  height: ${({ theme }) => theme.imageUploadPreview.dismiss.height};
  display: ${({ theme }) => theme.imageUploadPreview.dismiss.display};
  align-items: ${({ theme }) => theme.imageUploadPreview.dismiss.alignItems};
  justify-content: ${({ theme }) =>
    theme.imageUploadPreview.dismiss.justifyContent};
  border-radius: ${({ theme }) =>
    theme.imageUploadPreview.dismiss.borderRadius};
`;

const Upload = styled.Image`
  width: ${({ theme }) => theme.imageUploadPreview.upload.width};
  height: ${({ theme }) => theme.imageUploadPreview.upload.height};
  border-radius: ${({ theme }) => theme.imageUploadPreview.upload.borderRadius};
`;

const DismissImage = styled.Image`
  width: ${({ theme }) => theme.imageUploadPreview.dismissImage.width};
  height: ${({ theme }) => theme.imageUploadPreview.dismissImage.height};
`;

/**
 * ImageUploadPreview
 *
 * @example ./docs/ImageUploadPreview.md
 * @extends PureComponent
 */
export class ImageUploadPreview extends React.PureComponent {
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
      <Container>
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
}
