import React from 'react';
import { FlatList, Text, View } from 'react-native';
import PropTypes from 'prop-types';

import { FileIcon } from '../Attachment';
import UploadProgressIndicator from './UploadProgressIndicator';
import { FileState, ProgressIndicatorTypes } from '../../utils';
/**
 * FileUploadPreview
 *
 * @example ../docs/FileUploadPreview.md
 * @extends PureComponent
 */
const FILE_PREVIEW_HEIGHT = 50;
const FILE_PREVIEW_PADDING = 10;

/**
 * UI Component to preview the files set for upload
 *
 * @example ../docs/FileUploadPreview.md
 * @extends PureComponent
 */
class FileUploadPreview extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    /**
     * Custom UI component for attachment icon for type 'file' attachment.
     * Defaults to and accepts same props as: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileIcon.js
     */
    AttachmentFileIcon: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.elementType,
    ]),
    fileUploads: PropTypes.array.isRequired,
    removeFile: PropTypes.func,
    retryUpload: PropTypes.func,
  };

  static defaultProps = {
    AttachmentFileIcon: FileIcon,
  };

  _renderItem = ({ item }) => {
    let type;

    if (item.state === FileState.UPLOADING)
      type = ProgressIndicatorTypes.IN_PROGRESS;

    if (item.state === FileState.UPLOAD_FAILED)
      type = ProgressIndicatorTypes.RETRY;

    const AttachmentFileIcon = this.props.AttachmentFileIcon;
    return (
      <UploadProgressIndicator
        action={this.props.retryUpload.bind(this, item.id)}
        active={item.state !== FileState.UPLOADED}
        type={type}
      >
        <View
          style={{
            alignItems: 'center',
            borderColor: '#EBEBEB',
            borderWidth: 0.5,
            display: 'flex',
            flexDirection: 'row',
            height: FILE_PREVIEW_HEIGHT,
            justifyContent: 'space-between',
            marginBottom: 5,
            padding: FILE_PREVIEW_PADDING,
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
          <Text onPress={this.props.removeFile.bind(this, item.id)}>X</Text>
        </View>
      </UploadProgressIndicator>
    );
  };

  render() {
    if (!this.props.fileUploads || this.props.fileUploads.length === 0)
      return null;

    return (
      <View
        style={{
          display: 'flex',
          height: this.props.fileUploads.length * (FILE_PREVIEW_HEIGHT + 5),
          marginLeft: 10,
          marginRight: 10,
        }}
      >
        <FlatList
          data={this.props.fileUploads}
          keyExtractor={(item) => item.id}
          renderItem={this._renderItem}
          style={{ flex: 1 }}
        />
      </View>
    );
  }
}

export default FileUploadPreview;
