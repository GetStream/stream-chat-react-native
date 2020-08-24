import React from 'react';
import { FlatList } from 'react-native';
import PropTypes from 'prop-types';
import styled from '@stream-io/styled-components';

import UploadProgressIndicator from './UploadProgressIndicator';
import { FileState, ProgressIndicatorTypes } from '../../utils';
import { themed } from '../../styles/theme';

import closeRound from '../../images/icons/close-round.png';

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
 * UI Component to preview the images set for upload
 *
 * @example ../docs/ImageUploadPreview.md
 * @extends PureComponent
 */
class ImageUploadPreview extends React.PureComponent {
  static themePath = 'messageInput.imageUploadPreview';
  constructor(props) {
    super(props);
  }
  static propTypes = {
    /**
     * Its an object/map of id vs image objects which are set for upload. It has following structure:
     *
     * ```json
     *  {
     *    "randomly_generated_temp_id_1": {
     *        "id": "randomly_generated_temp_id_1",
     *        "file": // File object
     *        "status": "Uploading" // or "Finished"
     *      },
     *    "randomly_generated_temp_id_2": {
     *        "id": "randomly_generated_temp_id_2",
     *        "file": // File object
     *        "status": "Uploading" // or "Finished"
     *      },
     *  }
     * ```
     *
     * */
    imageUploads: PropTypes.array.isRequired,
    /**
     * @param id Index of image in `imageUploads` array in state of MessageInput.
     */
    removeImage: PropTypes.func,
    /**
     * @param id Index of image in `imageUploads` array in state of MessageInput.
     */
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
            action={retryUpload && retryUpload.bind(this, item.id)}
            active={item.state !== FileState.UPLOADED}
            type={type}
          >
            <Upload
              resizeMode='cover'
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
      <Container>
        <FlatList
          data={this.props.imageUploads}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={this._renderItem}
          style={{ flex: 1 }}
        />
      </Container>
    );
  }
}

export default themed(ImageUploadPreview);
