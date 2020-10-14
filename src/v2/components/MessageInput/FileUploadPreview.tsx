import React from 'react';
import { FlatList, ImageRequireSource } from 'react-native';

import { UploadProgressIndicator } from './UploadProgressIndicator';

import type { FileUpload } from './hooks/useMessageDetailsForState';

import { FileIcon, FileIconProps } from '../Attachment/FileIcon';

import { FileState, ProgressIndicatorTypes } from '../../utils/utils';

import { styled } from '../../../styles/styledComponents';

const closeRound: ImageRequireSource = require('../../../images/icons/close-round.png');

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

const Container = styled.View<{ fileUploadsLength: number }>`
  height: ${({ fileUploadsLength }) =>
    fileUploadsLength * (FILE_PREVIEW_HEIGHT + 5)}px;
  margin-horizontal: 10px;
  ${({ theme }) => theme.messageInput.fileUploadPreview.container.css};
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
  ${({ theme }) => theme.messageInput.fileUploadPreview.dismiss.css};
`;

const DismissImage = styled.Image`
  height: 10px;
  width: 10px;
  ${({ theme }) => theme.messageInput.fileUploadPreview.dismissImage.css};
`;

const FilenameText = styled.Text`
  padding-left: 10px;
  ${({ theme }) => theme.messageInput.fileUploadPreview.filenameText.css};
`;

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
        <AttachmentContainerView>
          <AttachmentView>
            <AttachmentFileIcon mimeType={item.file.type} size={20} />
            <FilenameText>
              {item.file.name
                ? item.file.name.length > 35
                  ? item.file.name.substring(0, 35).concat('...')
                  : item.file.name
                : ''}
            </FilenameText>
          </AttachmentView>
        </AttachmentContainerView>
      </UploadProgressIndicator>
      <Dismiss
        onPress={() => {
          if (removeFile) {
            removeFile(item.id);
          }
        }}
        testID='remove-file-upload-preview'
      >
        <DismissImage source={closeRound} />
      </Dismiss>
    </>
  );

  return fileUploads?.length > 0 ? (
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
