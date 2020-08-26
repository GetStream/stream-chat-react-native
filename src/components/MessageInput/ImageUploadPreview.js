import React from 'react';
import { FlatList } from 'react-native';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import UploadProgressIndicator from './UploadProgressIndicator';

import closeRound from '../../images/icons/close-round.png';

import { themed } from '../../styles/theme';

import { FileState, ProgressIndicatorTypes } from '../../utils';

const Container = styled.View`
  height: 70px;
  padding: 10px;
  ${({ theme }) => theme.messageInput.imageUploadPreview.container.css};
`;

const Dismiss = styled.TouchableOpacity`
  align-items: center;
  background-color: #fff;
  border-radius: 20px;
  height: 20px;
  justify-content: center;
  position: absolute;
  right: 5;
  top: 5;
  width: 20px;
  ${({ theme }) => theme.messageInput.imageUploadPreview.dismiss.css};
`;

const DismissImage = styled.Image`
  height: 10px;
  width: 10px;
  ${({ theme }) => theme.messageInput.imageUploadPreview.dismissImage.css};
`;

const ItemContainer = styled.View`
  align-items: flex-start;
  flex-direction: row;
  height: 50px;
  margin-left: 5px;
  ${({ theme }) => theme.messageInput.imageUploadPreview.itemContainer.css};
`;

const Upload = styled.Image`
  border-radius: 10px;
  height: 50px;
  width: 50px;
  ${({ theme }) => theme.messageInput.imageUploadPreview.upload.css};
`;

/**
 * UI Component to preview the images set for upload
 *
 * @example ../docs/ImageUploadPreview.md
 */
const ImageUploadPreview = ({ imageUploads, removeImage, retryUpload }) => {
  const renderItem = ({ item }) => {
    let type;

    if (item.state === FileState.UPLOADING) {
      type = ProgressIndicatorTypes.IN_PROGRESS;
    }

    if (item.state === FileState.UPLOAD_FAILED) {
      type = ProgressIndicatorTypes.RETRY;
    }

    return (
      <ItemContainer>
        <UploadProgressIndicator
          action={() => (retryUpload ? retryUpload(item.id) : null)}
          active={item.state !== FileState.UPLOADED}
          type={type}
        >
          <Upload
            resizeMode='cover'
            source={{ uri: item.file.uri || item.url }}
          />
        </UploadProgressIndicator>
        <Dismiss
          onPress={() => removeImage(item.id)}
          testID='remove-image-upload-preview'
        >
          <DismissImage source={closeRound} />
        </Dismiss>
      </ItemContainer>
    );
  };

  return imageUploads && imageUploads.length ? (
    <Container>
      <FlatList
        data={imageUploads}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ flex: 1 }}
      />
    </Container>
  ) : null;
};

ImageUploadPreview.propTypes = {
  /**
   * An array of image objects which are set for upload. It has the following structure:
   *
   * ```json
   *  [
   *    {
   *      "file": // File object,
   *      "id": "randomly_generated_temp_id_1",
   *      "state": "uploading" // or "finished",
   *    },
   *    {
   *      "file": // File object,
   *      "id": "randomly_generated_temp_id_2",
   *      "state": "uploading" // or "finished",
   *    },
   *  ]
   * ```
   *
   */
  imageUploads: PropTypes.array.isRequired,
  /**
   * Function for removing an image from the upload preview
   *
   * @param id string ID of image in `imageUploads` object in state of MessageInput
   */
  removeImage: PropTypes.func,
  /**
   * Function for attempting to upload an image
   *
   * @param id string ID of image in `imageUploads` object in state of MessageInput
   */
  retryUpload: PropTypes.func,
};

ImageUploadPreview.themePath = 'messageInput.imageUploadPreview';

export default themed(ImageUploadPreview);
