import React from 'react';
import { FlatList, ImageRequireSource } from 'react-native';

import { UploadProgressIndicator } from './UploadProgressIndicator';

import type { ImageUpload } from './hooks/useMessageDetailsForState';

import { FileState, ProgressIndicatorTypes } from '../../utils/utils';

import { styled } from '../../../styles/styledComponents';

const closeRound: ImageRequireSource = require('../../../images/icons/close-round.png');

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
  right: 5px;
  top: 5px;
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

export type ImageUploadPreviewProps = {
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
  imageUploads: ImageUpload[];
  /**
   * Function for removing an image from the upload preview
   *
   * @param id string ID of image in `imageUploads` object in state of MessageInput
   */
  removeImage: (id: string) => void;
  /**
   * Function for attempting to upload an image
   *
   * @param id string ID of image in `imageUploads` object in state of MessageInput
   */
  retryUpload: ({ newImage }: { newImage: ImageUpload }) => Promise<void>;
};

/**
 * UI Component to preview the images set for upload
 *
 * @example ./ImageUploadPreview.md
 */
export const ImageUploadPreview: React.FC<ImageUploadPreviewProps> = (
  props,
) => {
  const { imageUploads, removeImage, retryUpload } = props;

  const renderItem = ({ item }: { item: ImageUpload }) => (
    <ItemContainer>
      <UploadProgressIndicator
        action={() => {
          if (retryUpload) {
            retryUpload({ newImage: item });
          }
        }}
        active={item.state !== FileState.UPLOADED}
        type={
          item.state === FileState.UPLOADING
            ? ProgressIndicatorTypes.IN_PROGRESS
            : item.state === FileState.UPLOAD_FAILED
            ? ProgressIndicatorTypes.RETRY
            : undefined
        }
      >
        <Upload
          resizeMode='cover'
          source={{ uri: item.file.uri || item.url }}
        />
      </UploadProgressIndicator>
      <Dismiss
        onPress={() => {
          if (removeImage) {
            removeImage(item.id);
          }
        }}
        testID='remove-image-upload-preview'
      >
        <DismissImage source={closeRound} />
      </Dismiss>
    </ItemContainer>
  );

  return imageUploads?.length > 0 ? (
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
