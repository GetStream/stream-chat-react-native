import React from 'react';
import { FlatList, Text, View } from 'react-native';
import PropTypes from 'prop-types';

import { FileIcon } from '../Attachment';
import UploadProgressIndicator from './UploadProgressIndicator';

import { FileState, ProgressIndicatorTypes } from '../../utils';

const FILE_PREVIEW_HEIGHT = 50;
const FILE_PREVIEW_PADDING = 10;

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
        <View
          style={{
            alignItems: 'center',
            borderColor: '#EBEBEB',
            borderWidth: 0.5,
            flexDirection: 'row',
            height: FILE_PREVIEW_HEIGHT,
            justifyContent: 'space-between',
            padding: FILE_PREVIEW_PADDING,
            marginBottom: 5,
          }}
        >
          <View style={{ alignItems: 'center', flexDirection: 'row' }}>
            <AttachmentFileIcon mimeType={item.file.type} size={20} />
            <Text style={{ paddingLeft: 10 }}>
              {item.file.name.length > 35
                ? item.file.name.substring(0, 35).concat('...')
                : item.file.name}
            </Text>
          </View>
          <Text
            onPress={() => removeFile(item.id)}
            testID='remove-file-upload-preview'
          >
            X
          </Text>
        </View>
      </UploadProgressIndicator>
    );
  };

  return fileUploads && fileUploads.length ? (
    <View
      style={{
        height: fileUploads.length * (FILE_PREVIEW_HEIGHT + 5),
        marginHorizontal: 10,
      }}
    >
      <FlatList
        data={fileUploads}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ flex: 1 }}
      />
    </View>
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

export default FileUploadPreview;
