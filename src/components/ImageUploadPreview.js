import React from 'react';
import { View, Image, Text, FlatList, TouchableOpacity } from 'react-native';
import { WithProgressIndicator } from './WithProgressIndicator';
import PropTypes from 'prop-types';
import { FileState, ProgressIndicatorTypes } from '../utils';
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
        <View
          style={{
            padding: 5,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
          }}
        >
          <WithProgressIndicator
            active={item.state !== FileState.UPLOADED}
            type={type}
            action={this.props.retryUpload.bind(this, item.id)}
          >
            <Image
              source={{ uri: item.file.uri }}
              style={{ height: 100, width: 100, borderRadius: 10 }}
            />
          </WithProgressIndicator>
          <TouchableOpacity
            style={{
              backgroundColor: '#ebebeb',
              width: 25,
              height: 25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
              marginLeft: -25,
            }}
            onPress={() => {
              this.props.removeImage(item.id);
            }}
          >
            <Text>X</Text>
          </TouchableOpacity>
        </View>
      </React.Fragment>
    );
  };

  render() {
    if (!this.props.imageUploads || this.props.imageUploads.length === 0)
      return null;

    return (
      <View style={{ height: 100, display: 'flex' }}>
        <FlatList
          horizontal
          style={{ flex: 1 }}
          data={this.props.imageUploads}
          keyExtractor={(item) => item.id}
          renderItem={this._renderItem}
        />
      </View>
    );
  }
}
