import React from 'react';
import { FlatList } from 'react-native';
import styled from 'styled-components/native';
import PropTypes from 'prop-types';

import UploadProgressIndicator from './UploadProgressIndicator';

import FileIcon from '../Attachment/FileIcon';

import { themed } from '../../styles/theme';
import { FileState, ProgressIndicatorTypes } from '../../utils/utils';

const FILE_PREVIEW_HEIGHT = 50;
const FILE_PREVIEW_PADDING = 10;

const AttachmentContainerView = styled.View`
  align-items: center;
  border-color: #ebebeb;
  border-width: 0.5px;
  flex-direction: row;
  height: ${FILE_PREVIEW_HEIGHT}px;
  justify-content: space-between;
  margin-bottom: 5px;
  padding: ${FILE_PREVIEW_PADDING}px;
  ${({ theme }) =>
    theme.messageInput.fileUploadPreview.attachmentContainerView.css};
`;

const AttachmentView = styled.View`
  align-items: center;
  flex-direction: row;
  ${({ theme }) => theme.messageInput.fileUploadPreview.attachmentView.css};
`;

const Container = styled.View`
  height: ${({ fileUploadsLength }) =>
    fileUploadsLength * (FILE_PREVIEW_HEIGHT + 5)}px;
  margin-horizontal: 10px;
  ${({ theme }) => theme.messageInput.fileUploadPreview.container.css};
`;

const DismissText = styled.Text`
  ${({ theme }) => theme.messageInput.fileUploadPreview.dismissText.css};
`;

const FilenameText = styled.Text`
  padding-left: 10px;
  ${({ theme }) => theme.messageInput.fileUploadPreview.filenameText.css};
`;

/**
 * FileUploadPreview
 * UI Component to preview the files set for upload
 *
 * @example ../docs/FileUploadPreview.md
 */
const FileUploadPreview = ({
  AttachmentFileIcon = FileIcon,
  fileUploads,
  removeFile,
  retryUpload,
}) => {
  const renderItem = ({ item }) => {
    let type;

    if (item.state === FileState.UPLOADING) {
      type = ProgressIndicatorTypes.IN_PROGRESS;
    }

    if (item.state === FileState.UPLOAD_FAILED) {
      type = ProgressIndicatorTypes.RETRY;
    }

    return (
      <UploadProgressIndicator
        action={() => (retryUpload ? retryUpload(item.id) : null)}
        active={item.state !== FileState.UPLOADED}
        type={type}
      >
        <AttachmentContainerView>
          <AttachmentView>
            <AttachmentFileIcon mimeType={item.file.type} size={20} />
            <FilenameText>
              {item.file.name.length > 35
                ? item.file.name.substring(0, 35).concat('...')
                : item.file.name}
            </FilenameText>
          </AttachmentView>
          <DismissText
            onPress={() => removeFile(item.id)}
            testID='remove-file-upload-preview'
          >
            X
          </DismissText>
        </AttachmentContainerView>
      </UploadProgressIndicator>
    );
  };

  return fileUploads && fileUploads.length ? (
    <Container fileUploadsLength={fileUploads.length}>
      <FlatList
        data={fileUploads}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ flex: 1 }}
      />
    </Container>
  ) : null;
};

FileUploadPreview.propTypes = {
  /**
   * Custom UI component for attachment icon for type 'file' attachment.
   * Defaults to and accepts same props as: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileIcon.js
   */
  AttachmentFileIcon: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * An array of file objects which are set for upload. It has the following structure:
   *
   * ```json
   *  [
   *    {
   *      "file": // File object,
   *      "id": "randomly_generated_temp_id_1",
   *      "state": "uploading" // or "finished",
   *      "url": "https://url1.com",
   *    },
   *    {
   *      "file": // File object,
   *      "id": "randomly_generated_temp_id_2",
   *      "state": "uploading" // or "finished",
   *      "url": "https://url1.com",
   *    },
   *  ]
   * ```
   *
   */
  fileUploads: PropTypes.array.isRequired,
  /**
   * Function for removing a file from the upload preview
   *
   * @param id string ID of file in `fileUploads` object in state of MessageInput
   */
  removeFile: PropTypes.func,
  /**
   * Function for attempting to upload a file
   *
   * @param id string ID of file in `fileUploads` object in state of MessageInput
   */
  retryUpload: PropTypes.func,
};

FileUploadPreview.themePath = 'messageInput.fileUploadPreview';

export default themed(FileUploadPreview);
