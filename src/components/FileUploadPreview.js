import React from 'react';
import { View, Text, FlatList } from 'react-native';
import PropTypes from 'prop-types';
import FileIcon from './FileIcon';
import { WithProgressIndicator } from './WithProgressIndicator';
import { FileState, ProgressIndicatorTypes } from '../utils';
/**
 * FileUploadPreview
 *
 * @example ./docs/FileUploadPreview.md
 * @extends PureComponent
 */
const FILE_PREVIEW_HEIGHT = 50;
const FILE_PREVIEW_PADDING = 10;

export class FileUploadPreview extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    fileUploads: PropTypes.array.isRequired,
    removeFile: PropTypes.func,
    retryUpload: PropTypes.func,
  };

  _renderItem = ({ item }) => {
    let type;

    if (item.state === FileState.UPLOADING)
      type = ProgressIndicatorTypes.IN_PROGRESS;

    if (item.state === FileState.UPLOAD_FAILED)
      type = ProgressIndicatorTypes.RETRY;

    return (
      <WithProgressIndicator
        active={item.state !== FileState.UPLOADED}
        type={type}
        action={this.props.handleRetry.bind(this, item.id)}
      >
        <View
          style={{
            height: FILE_PREVIEW_HEIGHT,
            padding: FILE_PREVIEW_PADDING,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 5,
            borderColor: '#EBEBEB',
            borderWidth: 0.5,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FileIcon
              filename={item.file.name}
              mimeType={item.file.type}
              size={20}
            />
            <Text style={{ paddingLeft: 10 }}>
              {item.file.name.length > 35
                ? item.file.name.substring(0, 35).concat('...')
                : item.file.name}
            </Text>
          </View>
          <Text onPress={this.props.removeFile.bind(this, item.id)}>X</Text>
        </View>
      </WithProgressIndicator>
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
          marginRight: 10,
          marginLeft: 10,
        }}
      >
        <FlatList
          style={{ flex: 1 }}
          data={this.props.fileUploads}
          keyExtractor={(item) => item.id}
          renderItem={this._renderItem}
        />
      </View>
    );
  }
}
