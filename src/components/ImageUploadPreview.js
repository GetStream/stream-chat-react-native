import React from 'react';
import { FlatList } from 'react-native';
import { WithProgressIndicator } from './WithProgressIndicator';
import PropTypes from 'prop-types';
import { FileState, ProgressIndicatorTypes } from '../utils';
import styled from 'styled-components';
import { getTheme } from '../styles/theme';

import closeRound from '../images/icons/close-round.png';

const Container = styled.View`
  height: ${(props) => getTheme(props).imageUploadPreview.container.height};
  display: ${(props) => getTheme(props).imageUploadPreview.container.display};
  padding: ${(props) => getTheme(props).imageUploadPreview.container.padding}px;
`;

const ItemContainer = styled.View`
  display: ${(props) =>
    getTheme(props).imageUploadPreview.itemContainer.display};
  height: ${(props) => getTheme(props).imageUploadPreview.itemContainer.height};
  flex-direction: ${(props) =>
    getTheme(props).imageUploadPreview.itemContainer.flexDirection};
  align-items: ${(props) =>
    getTheme(props).imageUploadPreview.itemContainer.alignItems};
  margin-left: ${(props) =>
    getTheme(props).imageUploadPreview.itemContainer.marginLeft};
`;

const Dismiss = styled.TouchableOpacity`
  position: ${(props) => getTheme(props).imageUploadPreview.dismiss.position};
  top: ${(props) => getTheme(props).imageUploadPreview.dismiss.top};
  right: ${(props) => getTheme(props).imageUploadPreview.dismiss.right};
  background-color: ${(props) =>
    getTheme(props).imageUploadPreview.dismiss.backgroundColor};
  width: ${(props) => getTheme(props).imageUploadPreview.dismiss.width};
  height: ${(props) => getTheme(props).imageUploadPreview.dismiss.height};
  display: ${(props) => getTheme(props).imageUploadPreview.dismiss.display};
  align-items: ${(props) =>
    getTheme(props).imageUploadPreview.dismiss.alignItems};
  justify-content: ${(props) =>
    getTheme(props).imageUploadPreview.dismiss.justifyContent};
  border-radius: ${(props) =>
    getTheme(props).imageUploadPreview.dismiss.borderRadius};
`;

const Upload = styled.Image`
  width: ${(props) => getTheme(props).imageUploadPreview.upload.width};
  height: ${(props) => getTheme(props).imageUploadPreview.upload.height};
  border-radius: ${(props) =>
    getTheme(props).imageUploadPreview.upload.borderRadius};
`;

const DismissImage = styled.Image`
  width: ${(props) => getTheme(props).imageUploadPreview.dismissImage.width};
  height: ${(props) => getTheme(props).imageUploadPreview.dismissImage.height};
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
            action={this.props.retryUpload.bind(this, item.id)}
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
