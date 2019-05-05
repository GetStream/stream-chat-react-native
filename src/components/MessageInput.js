import React, { PureComponent } from 'react';
import { View, TextInput, Image, TouchableOpacity } from 'react-native';
import { withChannelContext } from '../context';
import { logChatPromiseExecution } from 'stream-chat';
import { buildStylesheet } from '../styles/styles';
import iconPicture from '../images/icons/picture.png';
import iconAttachment from '../images/icons/attachment.png';
import iconEdit from '../images/icons/icon_edit.png';
import iconNewMessage from '../images/icons/icon_new_message.png';
import { ImageUploadPreview } from './ImageUploadPreview';
import { FileUploadPreview } from './FileUploadPreview';
import { pickImage, pickDocument } from '../native';
import { lookup } from 'mime-types';
import Immutable from 'seamless-immutable';
import { FileState } from '../utils';
import PropTypes from 'prop-types';

// https://stackoverflow.com/a/6860916/2570866
function generateRandomId() {
  // prettier-ignore
  return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

const MessageInput = withChannelContext(
  class MessageInput extends PureComponent {
    constructor(props) {
      super(props);
      this.state = {
        text: this.props.editing ? this.props.editing.text : '',
        imageOrder: Immutable([]),
        imageUploads: Immutable({}),
        fileOrder: Immutable([]),
        fileUploads: Immutable({}),
        numberOfUploads: 0,
      };
    }

    static propTypes = {
      /** Override image upload request */
      doImageUploadRequest: PropTypes.func,
      /** Override file upload request */
      doFileUploadRequest: PropTypes.func,
      maxNumberOfFiles: PropTypes.number,
    };

    componentDidMount() {
      if (this.props.editing) this.inputBox.focus();
    }

    componentDidUpdate(prevProps) {
      if (this.props.editing) this.inputBox.focus();
      if (
        this.props.editing &&
        prevProps.editing &&
        this.props.editing.id === prevProps.editing.id
      ) {
        return;
      }

      if (this.props.editing && !prevProps.editing) {
        this.setState({ text: this.props.editing.text });
      }

      if (
        this.props.editing &&
        prevProps.editing &&
        this.props.editing.id !== prevProps.editing.id
      ) {
        this.setState({ text: this.props.editing.text });
      }
    }

    sendMessage = async () => {
      const attachments = [];
      for (const id of this.state.imageOrder) {
        const image = this.state.imageUploads[id];
        if (!image || image.state === FileState.UPLOAD_FAILED) {
          continue;
        }
        if (image.state === FileState.UPLOADING) {
          // TODO: show error to user that they should wait until image is uploaded
          return;
        }
        attachments.push({
          type: 'image',
          image_url: image.url,
          fallback: image.file.name,
        });
      }

      for (const id of this.state.fileOrder) {
        const upload = this.state.fileUploads[id];
        if (!upload || upload.state === FileState.UPLOAD_FAILED) {
          continue;
        }
        if (upload.state === FileState.UPLOADING) {
          // TODO: show error to user that they should wait until image is uploaded
          return;
        }
        attachments.push({
          type: 'file',
          asset_url: upload.url,
          title: upload.file.name,
          mime_type: upload.file.type,
          file_size: upload.file.size,
        });
      }

      try {
        await this.props.sendMessage({
          text: this.state.text,
          parent: this.props.parent,
          attachments,
        });
        this.setState({
          text: '',
          imageUploads: Immutable({}),
          imageOrder: Immutable([]),
          fileUploads: Immutable({}),
          fileOrder: Immutable([]),
        });
      } catch (err) {
        console.log('Fialed');
      }
    };

    updateMessage = async () => {
      try {
        await this.props.client.updateMessage({
          ...this.props.editing,
          text: this.state.text,
        });

        this.setState({ text: '' });
        this.props.clearEditingState();
      } catch (err) {
        console.log(err);
      }
    };

    handleChange = (text) => {
      this.setState({ text });
      if (text) {
        logChatPromiseExecution(
          this.props.channel.keystroke(),
          'start typing event',
        );
      }
    };

    // https://stackoverflow.com/a/29234240/7625485
    constructTypingString = (dict) => {
      const arr2 = Object.keys(dict);
      const arr3 = [];
      arr2.forEach((item, i) =>
        arr3.push(dict[arr2[i]].user.name || dict[arr2[i]].user.id),
      );
      let outStr = '';
      if (arr3.length === 1) {
        outStr = arr3[0] + ' is typing...';
        dict;
      } else if (arr3.length === 2) {
        //joins all with "and" but =no commas
        //example: "bob and sam"
        outStr = arr3.join(' and ') + ' are typing...';
      } else if (arr3.length > 2) {
        //joins all with commas, but last one gets ", and" (oxford comma!)
        //example: "bob, joe, and sam"
        outStr =
          arr3.slice(0, -1).join(', ') +
          ', and ' +
          arr3.slice(-1) +
          ' are typing...';
      }

      return outStr;
    };

    _pickFile = async () => {
      if (this.state.numberOfUploads >= this.props.maxNumberOfFiles) return;

      const id = generateRandomId();
      const result = await pickDocument();
      if (result.type === 'cancel') {
        return;
      }
      const mimeType = lookup(result.name);
      /* eslint-disable */
      this.setState((prevState) => {
        return {
          numberOfUploads: prevState.numberOfUploads + 1,
          fileOrder: prevState.fileOrder.concat([id]),
          fileUploads: prevState.fileUploads.setIn([id], {
            id,
            file: { ...result, type: mimeType },
            state: FileState.UPLOADING,
          }),
        };
      });
      /* eslint-enable */

      this._uploadFile(id);
    };

    _uploadFile = async (id) => {
      const doc = this.state.fileUploads[id];
      if (!doc) {
        return;
      }
      const { file } = doc;

      await this.setState((prevState) => ({
        fileUploads: prevState.fileUploads.setIn(
          [id, 'state'],
          FileState.UPLOADING,
        ),
      }));

      let response = {};
      response = {};
      try {
        if (this.props.doDocUploadRequest) {
          response = await this.props.doDocUploadRequest(
            file,
            this.props.channel,
          );
        } else {
          response = await this.props.channel.sendFile(file.uri);
        }
      } catch (e) {
        console.warn(e);
        await this.setState((prevState) => {
          const image = prevState.fileUploads[id];
          if (!image) {
            return {
              numberOfUploads: prevState.numberOfUploads - 1,
            };
          }
          return {
            fileUploads: prevState.fileUploads.setIn(
              [id, 'state'],
              FileState.UPLOAD_FAILED,
            ),
            numberOfUploads: prevState.numberOfUploads - 1,
          };
        });

        return;
      }

      this.setState((prevState) => ({
        fileUploads: prevState.fileUploads
          .setIn([id, 'state'], FileState.UPLOADED)
          .setIn([id, 'url'], response.file),
      }));
    };

    _pickImage = async () => {
      if (this.state.numberOfUploads >= this.props.maxNumberOfFiles) return;

      const id = generateRandomId();
      const result = await pickImage();

      if (result.cancelled) {
        return;
      }
      /* eslint-disable */
      this.setState((prevState) => {
        return {
          numberOfUploads: prevState.numberOfUploads + 1,
          imageOrder: prevState.imageOrder.concat([id]),
          imageUploads: prevState.imageUploads.setIn([id], {
            id,
            file: result,
            state: FileState.UPLOADING,
          }),
        };
      });
      /* eslint-enable */

      this._uploadImage(id);
    };

    _removeImage = (id) => {
      this.setState((prevState) => {
        const img = prevState.imageUploads[id];
        if (!img) {
          return {};
        }
        return {
          numberOfUploads: prevState.numberOfUploads - 1,
          imageUploads: prevState.imageUploads.set(id, undefined), // remove
          imageOrder: prevState.imageOrder.filter((_id) => id !== _id),
        };
      });
    };

    _removeFile = (id) => {
      this.setState((prevState) => {
        const file = prevState.fileUploads[id];
        if (!file) {
          return {};
        }
        return {
          numberOfUploads: prevState.numberOfUploads - 1,
          fileUploads: prevState.fileUploads.set(id, undefined), // remove
          fileOrder: prevState.fileOrder.filter((_id) => id !== _id),
        };
      });
    };

    _uploadImage = async (id) => {
      const img = this.state.imageUploads[id];
      if (!img) {
        return;
      }
      const { file } = img;

      await this.setState((prevState) => ({
        imageUploads: prevState.imageUploads.setIn(
          [id, 'state'],
          FileState.UPLOADING,
        ),
      }));

      let response = {};
      response = {};

      const filename = file.uri.replace(/^(file:\/\/|content:\/\/)/, '');
      const contentType = lookup(filename) || 'application/octet-stream';

      try {
        if (this.props.doImageUploadRequest) {
          response = await this.props.doImageUploadRequest(
            file,
            this.props.channel,
          );
        } else {
          response = await this.props.channel.sendImage(
            file.uri,
            null,
            contentType,
          );
        }
      } catch (e) {
        console.warn(e);
        await this.setState((prevState) => {
          const image = prevState.imageUploads[id];
          if (!image) {
            return {
              numberOfUploads: prevState.numberOfUploads - 1,
            };
          }

          return {
            imageUploads: prevState.imageUploads.setIn(
              [id, 'state'],
              FileState.UPLOAD_FAILED,
            ),
            numberOfUploads: prevState.numberOfUploads - 1,
          };
        });

        return;
      }
      this.setState((prevState) => ({
        imageUploads: prevState.imageUploads
          .setIn([id, 'state'], FileState.UPLOADED)
          .setIn([id, 'url'], response.file),
      }));
    };

    render() {
      const styles = buildStylesheet('MessageInput', this.props.style);

      return (
        <React.Fragment>
          {this.state.fileUploads && (
            <FileUploadPreview
              removeFile={this._removeFile}
              retryUpload={this._uploadFile}
              fileUploads={this.state.fileOrder.map(
                (id) => this.state.fileUploads[id],
              )}
            />
          )}
          <View style={styles.container}>
            {this.state.imageUploads && (
              <ImageUploadPreview
                removeImage={this._removeImage}
                retryUpload={this._uploadImage}
                imageUploads={this.state.imageOrder.map(
                  (id) => this.state.imageUploads[id],
                )}
              />
            )}
            <View style={styles.inputBoxContainer}>
              <TouchableOpacity
                style={styles.pictureButton}
                title="Pick an image from camera roll"
                onPress={this._pickImage}
              >
                <Image source={iconPicture} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pictureButton}
                title="Pick a document from camera roll"
                onPress={this._pickFile}
              >
                <Image
                  source={iconAttachment}
                  style={{ height: 15, width: 15 }}
                />
              </TouchableOpacity>
              <TextInput
                ref={(o) => (this.inputBox = o)}
                style={styles.inputBox}
                placeholder="Write your message"
                onChangeText={this.handleChange}
                numberOfLines={3}
                value={this.state.text}
                multiline
              />
              <TouchableOpacity
                style={styles.sendButton}
                title="Pick an image from camera roll"
                onPress={
                  this.props.editing ? this.updateMessage : this.sendMessage
                }
              >
                {this.props.editing ? (
                  <Image source={iconEdit} />
                ) : (
                  <Image source={iconNewMessage} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          {/* <Text style={{ textAlign: 'right', height: 20 }}>
          {this.props.channel.state.typing
            ? this.constructTypingString(this.props.channel.state.typing)
            : ''}
        </Text> */}
        </React.Fragment>
      );
    }
  },
);

export { MessageInput };
