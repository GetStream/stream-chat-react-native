import React from 'react';
import {
  FlatList,
  Image,
  ImageRequireSource,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { UploadProgressIndicator } from './UploadProgressIndicator';

import type { FileUpload } from './hooks/useMessageDetailsForState';

import { FileIcon, FileIconProps } from '../Attachment/FileIcon';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { FileState, ProgressIndicatorTypes } from '../../utils/utils';

const closeRound: ImageRequireSource = require('../../../images/icons/close-round.png');

const FILE_PREVIEW_HEIGHT = 50;
const FILE_PREVIEW_PADDING = 10;

const styles = StyleSheet.create({
  attachmentContainerView: {
    alignItems: 'center',
    borderColor: '#EBEBEB',
    borderWidth: 0.5,
    flexDirection: 'row',
    height: FILE_PREVIEW_HEIGHT,
    justifyContent: 'space-between',
    marginBottom: 5,
    padding: FILE_PREVIEW_PADDING,
  },
  attachmentView: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  container: {
    marginHorizontal: 10,
  },
  dismiss: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 5,
    top: 5,
    width: 20,
  },
  dismissImage: {
    height: 10,
    width: 10,
  },
  filenameText: {
    paddingLeft: 10,
  },
});

export type FileUploadPreviewProps = {
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
  fileUploads: FileUpload[];
  /**
   * Function for removing a file from the upload preview
   *
   * @param id string ID of file in `fileUploads` object in state of MessageInput
   */
  removeFile: (id: string) => void;
  /**
   * Function for attempting to upload a file
   *
   * @param id string ID of file in `fileUploads` object in state of MessageInput
   */
  retryUpload: ({ newFile }: { newFile: FileUpload }) => Promise<void>;
  /**
   * Custom UI component for attachment icon for type 'file' attachment.
   * Defaults to and accepts same props as: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/FileIcon.tsx
   */
  AttachmentFileIcon?: React.ComponentType<FileIconProps>;
};

/**
 * FileUploadPreview
 * UI Component to preview the files set for upload
 *
 * @example ./FileUploadPreview.md
 */
export const FileUploadPreview: React.FC<FileUploadPreviewProps> = (props) => {
  const {
    AttachmentFileIcon = FileIcon,
    fileUploads,
    removeFile,
    retryUpload,
  } = props;

  const {
    theme: {
      messageInput: {
        fileUploadPreview: {
          attachmentContainerView,
          attachmentView,
          container,
          dismiss,
          dismissImage,
          filenameText,
        },
      },
    },
  } = useTheme();

  const renderItem = ({ item }: { item: FileUpload }) => (
    <>
      <UploadProgressIndicator
        action={() => {
          if (retryUpload) {
            retryUpload({ newFile: item });
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
        <View style={[styles.attachmentContainerView, attachmentContainerView]}>
          <View style={[styles.attachmentView, attachmentView]}>
            <AttachmentFileIcon mimeType={item.file.type} size={20} />
            <Text style={[styles.filenameText, filenameText]}>
              {item.file.name
                ? item.file.name.length > 35
                  ? item.file.name.substring(0, 35).concat('...')
                  : item.file.name
                : ''}
            </Text>
          </View>
        </View>
      </UploadProgressIndicator>
      <TouchableOpacity
        onPress={() => {
          if (removeFile) {
            removeFile(item.id);
          }
        }}
        style={[styles.dismiss, dismiss]}
        testID='remove-file-upload-preview'
      >
        <Image
          source={closeRound}
          style={[styles.dismissImage, dismissImage]}
        />
      </TouchableOpacity>
    </>
  );

  return fileUploads?.length > 0 ? (
    <View
      style={[
        styles.container,
        { height: fileUploads.length * (FILE_PREVIEW_HEIGHT + 5) },
        container,
      ]}
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

FileUploadPreview.displayName =
  'FileUploadPreview{messageInput{fileUploadPreview}}';
