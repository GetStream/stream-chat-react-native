import React from 'react';
import { FlatList } from 'react-native';
import { WithProgressIndicator } from './WithProgressIndicator';
import PropTypes from 'prop-types';
import { FileState, ProgressIndicatorTypes } from '../utils';
import styled from '@stream-io/styled-components';

import closeRound from '../images/icons/close-round.png';

const Container = styled.View`
  height: ${(props) => props.theme.imageUploadPreview.container.height};
  display: ${(props) => props.theme.imageUploadPreview.container.display};
  padding: ${(props) => props.theme.imageUploadPreview.container.padding}px;
`;

const ItemContainer = styled.View`
  display: ${(props) => props.theme.imageUploadPreview.itemContainer.display};
  height: ${(props) => props.theme.imageUploadPreview.itemContainer.height};
  flex-direction: ${(props) =>
    props.theme.imageUploadPreview.itemContainer.flexDirection};
  align-items: ${(props) =>
    props.theme.imageUploadPreview.itemContainer.alignItems};
  margin-left: ${(props) =>
    props.theme.imageUploadPreview.itemContainer.marginLeft};
`;

const Dismiss = styled.TouchableOpacity`
  position: ${(props) => props.theme.imageUploadPreview.dismiss.position};
  top: ${(props) => props.theme.imageUploadPreview.dismiss.top};
  right: ${(props) => props.theme.imageUploadPreview.dismiss.right};
  background-color: ${(props) =>
    props.theme.imageUploadPreview.dismiss.backgroundColor};
  width: ${(props) => props.theme.imageUploadPreview.dismiss.width};
  height: ${(props) => props.theme.imageUploadPreview.dismiss.height};
  display: ${(props) => props.theme.imageUploadPreview.dismiss.display};
  align-items: ${(props) => props.theme.imageUploadPreview.dismiss.alignItems};
  justify-content: ${(props) =>
    props.theme.imageUploadPreview.dismiss.justifyContent};
  border-radius: ${(props) =>
    props.theme.imageUploadPreview.dismiss.borderRadius};
`;

const Upload = styled.Image`
  width: ${(props) => props.theme.imageUploadPreview.upload.width};
  height: ${(props) => props.theme.imageUploadPreview.upload.height};
  border-radius: ${(props) =>
    props.theme.imageUploadPreview.upload.borderRadius};
`;

const DismissImage = styled.Image`
  width: ${(props) => props.theme.imageUploadPreview.dismissImage.width};
  height: ${(props) => props.theme.imageUploadPreview.dismissImage.height};
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
