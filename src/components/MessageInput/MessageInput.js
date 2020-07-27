import React, { PureComponent } from 'react';
import { View } from 'react-native';
import { lookup } from 'mime-types';
import Immutable from 'seamless-immutable';
import PropTypes from 'prop-types';
import uniq from 'lodash/uniq';
import styled from '@stream-io/styled-components';
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet';

import { logChatPromiseExecution } from 'stream-chat';

import {
  withChannelContext,
  withSuggestionsContext,
  withKeyboardContext,
  withTranslationContext,
} from '../../context';
import { IconSquare } from '../IconSquare';

import { pickImage, pickDocument } from '../../native';
import { FileState, ACITriggerSettings } from '../../utils';
import { themed } from '../../styles/theme';

import SendButton from './SendButton';
import AttachButton from './AttachButton';
import ImageUploadPreview from './ImageUploadPreview';
import FileUploadPreview from './FileUploadPreview';
import { AutoCompleteInput } from '../AutoCompleteInput';

import iconGallery from '../../images/icons/icon_attach-media.png';
import iconFolder from '../../images/icons/icon_folder.png';
import iconClose from '../../images/icons/icon_close.png';

// https://stackoverflow.com/a/6860916/2570866
function generateRandomId() {
  // prettier-ignore
  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

const Container = styled(({ padding, ...rest }) => <View {...rest} />)`
  display: flex;
  flex-direction: column;
  border-radius: 10;
  background-color: rgba(0, 0, 0, 0.05);
  padding-top: ${({ theme, padding }) =>
    padding ? theme.messageInput.container.conditionalPadding : 0}px;
  margin-left: 10px;
  margin-right: 10px;
  ${({ theme }) => theme.messageInput.container.css}
`;

const EditingBoxContainer = styled.View`
  padding-left: 0;
  padding-right: 0;
  shadow-color: grey;
  shadow-opacity: 0.5;
  z-index: 100;
  background-color: white;
  ${({ theme }) => theme.messageInput.editingBoxContainer.css}
`;

const EditingBoxHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  ${({ theme }) => theme.messageInput.editingBoxHeader.css}
`;

const EditingBoxHeaderTitle = styled.Text`
  font-weight: bold;
  ${({ theme }) => theme.messageInput.editingBoxHeaderTitle.css}
`;

const InputBoxContainer = styled.View`
  display: flex;
  flex-direction: row;
  padding-left: 10px;
  padding-right: 10px;
  min-height: 46;
  margin: 10px;
  align-items: center;
  ${({ theme }) => theme.messageInput.inputBoxContainer.css}
`;

const ActionSheetTitleContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
  padding-left: 20;
  padding-right: 20;
  ${({ theme }) => theme.messageInput.actionSheet.titleContainer.css};
`;

const ActionSheetTitleText = styled.Text`
  font-weight: bold;
  ${({ theme }) => theme.messageInput.actionSheet.titleText.css};
`;

const ActionSheetButtonContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  padding-left: 20;
  ${({ theme }) => theme.messageInput.actionSheet.buttonContainer.css};
`;

const ActionSheetButtonText = styled.Text`
  ${({ theme }) => theme.messageInput.actionSheet.buttonText.css};
`;

/**
 * UI Component for message input
 * Its a consumer of [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext)
 * and [Keyboard Context](https://getstream.github.io/stream-chat-react-native/#keyboardcontext)
 *
 * @example ../docs/MessageInput.md
 * @extends PureComponent
 */
class MessageInput extends PureComponent {
  constructor(props) {
    super(props);
    const state = this.getMessageDetailsForState(
      props.editing,
      props.initialValue,
    );
    this.state = {
      ...state,
      asyncIds: Immutable([]), // saves data for images that resolve after hitting send
      asyncUploads: Immutable({}), // saves data for images that resolve after hitting send
    };
    this.sending = false;
  }

  static themePath = 'messageInput';
  static propTypes = {
    /** Initial value to set on input */
    initialValue: PropTypes.string,
    /**
     * Callback that is called when the text input's text changes. Changed text is passed as a single string argument to the callback handler.
     *
     * @param newText
     */
    onChangeText: PropTypes.func,
    /**
     * Override image upload request
     *
     * @param file    File object - {uri: ''}
     * @param channel Current channel object
     * */
    doImageUploadRequest: PropTypes.func,
    /**
     * Override file upload request
     *
     * @param file    File object - {uri: '', name: ''}
     * @param channel Current channel object
     * */
    doDocUploadRequest: PropTypes.func,
    /** Limit on allowed number of files to attach at a time. */
    maxNumberOfFiles: PropTypes.number,
    /** If component should have image picker functionality  */
    hasImagePicker: PropTypes.bool,
    /** @see See [keyboard context](https://getstream.github.io/stream-chat-react-native/#keyboardcontext) */
    dismissKeyboard: PropTypes.func,
    /** If component should have file picker functionality  */
    hasFilePicker: PropTypes.bool,
    /** @see See [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
    members: PropTypes.object,
    /** @see See [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
    watchers: PropTypes.object,
    /** @see See [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
    editing: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
    /** @see See [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
    clearEditingState: PropTypes.func,
    /** @see See [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
    client: PropTypes.object,
    /** @see See [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
    sendMessage: PropTypes.func,
    /** Parent message object - in case of thread */
    parent: PropTypes.object,
    /** @see See [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
    channel: PropTypes.object,
    /**
     * Ref callback to set reference on input box container
     * @see See [keyboard context](https://getstream.github.io/stream-chat-react-native/#keyboardcontext)
     * */
    setInputBoxContainerRef: PropTypes.func,
    /** @see See [suggestions context](https://getstream.github.io/stream-chat-react-native/#suggestionscontext) */
    openSuggestions: PropTypes.func,
    /** @see See [suggestions context](https://getstream.github.io/stream-chat-react-native/#suggestionscontext) */
    closeSuggestions: PropTypes.func,
    /** @see See [suggestions context](https://getstream.github.io/stream-chat-react-native/#suggestionscontext) */
    updateSuggestions: PropTypes.func,
    /**
     * Custom UI component for send button.
     *
     * Defaults to and accepts same props as: [SendButton](https://getstream.github.io/stream-chat-react-native/#sendbutton)
     * */
    SendButton: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
    /**
     * Custom UI component for attach button.
     *
     * Defaults to and accepts same props as: [AttachButton](https://getstream.github.io/stream-chat-react-native/#attachbutton)
     * */
    AttachButton: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
    /**
     * Additional props for underlying TextInput component. These props will be forwarded as it is to TextInput component.
     *
     * @see See https://facebook.github.io/react-native/docs/textinput#reference
     */
    additionalTextInputProps: PropTypes.object,
    /**
     * Style object for actionsheet (used for option to choose file attachment or photo attachment).
     * Supported styles: https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js
     */
    actionSheetStyles: PropTypes.object,
    /**
     * Custom UI component for attachment icon for type 'file' attachment in preview.
     * Defaults to and accepts same props as: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileIcon.js
     */
    AttachmentFileIcon: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.elementType,
    ]),
    /** Disables the child MessageInput component */
    disabled: PropTypes.bool,
    /**
     * For images still in uploading state when user hits send, send text immediately and send image as follow-up message once uploaded
     */
    sendImageAsync: PropTypes.bool,
  };

  static defaultProps = {
    hasImagePicker: true,
    hasFilePicker: true,
    disabled: false,
    sendImageAsync: false,
    SendButton,
    AttachButton,
  };

  getMessageDetailsForState = (message, initialValue) => {
    const imageOrder = [];
    const imageUploads = {};
    const fileOrder = [];
    const fileUploads = {};
    const attachments = [];
    let mentioned_users = [];
    let text = initialValue || '';

    if (message) {
      text = message.text;
      for (const attach of message.attachments) {
        if (attach.type === 'image') {
          const id = generateRandomId();
          imageOrder.push(id);
          imageUploads[id] = {
            id,
            url: attach.image_url,
            state: 'finished',
            file: { name: attach.fallback },
          };
        } else if (attach.type === 'file') {
          const id = generateRandomId();
          fileOrder.push(id);
          fileUploads[id] = {
            id,
            url: attach.asset_url,
            state: 'finished',
            file: {
              name: attach.title,
              type: attach.mime_type,
              size: attach.file_size,
            },
          };
        } else {
          attachments.push(attach);
        }
      }

      if (message.mentioned_users) {
        mentioned_users = [...message.mentioned_users];
      }
    }
    return {
      text,
      attachments,
      imageOrder,
      imageUploads: Immutable(imageUploads),
      fileOrder,
      fileUploads: Immutable(fileUploads),
      mentioned_users,
      numberOfUploads: 0,
    };
  };

  getMembers = () => {
    const result = [];
    const members = this.props.members;
    if (members && Object.values(members).length) {
      Object.values(members).forEach((member) => result.push(member.user));
    }

    return result;
  };

  getWatchers = () => {
    const result = [];
    const watchers = this.props.watchers;
    if (watchers && Object.values(watchers).length) {
      result.push(...Object.values(watchers));
    }

    return result;
  };

  getUsers = () => {
    const users = [...this.getMembers(), ...this.getWatchers()];

    // make sure we don't list users twice
    const uniqueUsers = {};
    for (const user of users) {
      if (user !== undefined && !uniqueUsers[user.id]) {
        uniqueUsers[user.id] = user;
      }
    }
    const usersArray = Object.values(uniqueUsers);

    return usersArray;
  };

  componentDidMount() {
    if (this.props.editing) this.inputBox.focus();
  }

  componentDidUpdate(prevProps) {
    if (Object.keys(this.state.asyncUploads).length) {
      /**
       * When successful image upload response occurs after hitting send,
       * send a follow up message with the image
       */
      this.sending = true;
      this.state.asyncIds.forEach((id) => this.sendMessageAsync(id));
      this.sending = false;
    }

    if (this.props.editing) this.inputBox.focus();
    if (
      this.props.editing &&
      prevProps.editing &&
      this.props.editing.id === prevProps.editing.id
    ) {
      return;
    }

    if (this.props.editing && !prevProps.editing) {
      this.setState(
        this.getMessageDetailsForState(
          this.props.editing,
          this.props.initialValue,
        ),
      );
    }

    if (
      this.props.editing &&
      prevProps.editing &&
      this.props.editing.id !== prevProps.editing.id
    ) {
      this.setState(
        this.getMessageDetailsForState(
          this.props.editing,
          this.props.initialValue,
        ),
      );
    }

    if (!this.props.editing && prevProps.editing) {
      this.setState(
        this.getMessageDetailsForState(null, this.props.initialValue),
      );
    }
  }

  onSelectItem = (item) => {
    this.setState((prevState) => ({
      mentioned_users: [...prevState.mentioned_users, item.id],
    }));
  };

  /** Checks if the message is valid or not. Accordingly we can enable/disable send button */
  isValidMessage = () => {
    if (this.state.text && this.state.text !== '') return true;

    for (const id of this.state.imageOrder) {
      const image = this.state.imageUploads[id];
      if (!image || image.state === FileState.UPLOAD_FAILED) {
        continue;
      }
      if (image.state === FileState.UPLOADING) {
        // TODO: show error to user that they should wait until image is uploaded
        return false;
      }

      return true;
    }

    for (const id of this.state.fileOrder) {
      const upload = this.state.fileUploads[id];
      if (!upload || upload.state === FileState.UPLOAD_FAILED) {
        continue;
      }
      if (upload.state === FileState.UPLOADING) {
        // TODO: show error to user that they should wait until image is uploaded
        return false;
      }

      return true;
    }

    return false;
  };

  sendMessageAsync = (id) => {
    const image = this.state.asyncUploads[id];
    if (!image || image.state === FileState.UPLOAD_FAILED) return;

    if (image.state === FileState.UPLOADED) {
      const attachments = [
        {
          type: 'image',
          image_url: image.url,
        },
      ];

      try {
        this.props.sendMessage({
          text: '',
          parent: this.props.parent,
          mentioned_users: [],
          attachments,
        });

        this.setState((prevState) => ({
          numberOfUploads: prevState.numberOfUploads - 1,
          asyncIds: prevState.asyncIds.splice(
            prevState.asyncIds.indexOf(id),
            1,
          ),
          asyncUploads: prevState.asyncUploads.without([id]),
        }));
      } catch (err) {
        console.log('Failed');
      }
    }
  };

  sendMessage = async () => {
    if (this.sending) return;
    this.sending = true;

    const { text } = this.state;
    await this.setState({ text: '' }, () => this.inputBox.clear());

    const attachments = [];
    for (const id of this.state.imageOrder) {
      const image = this.state.imageUploads[id];

      if (!image || image.state === FileState.UPLOAD_FAILED) {
        continue;
      }

      if (image.state === FileState.UPLOADING) {
        // TODO: show error to user that they should wait until image is uploaded
        if (this.props.sendImageAsync) {
          /**
           * If user hit send before image uploaded, push ID into a queue to later
           * be matched with the successful CDN response
           */
          this.setState((prevState) => ({
            asyncIds: [...prevState.asyncIds, id],
          }));
        } else {
          this.sending = false;
          return this.setState({ text });
        }
      }

      if (image.state === FileState.UPLOADED) {
        attachments.push({
          type: 'image',
          image_url: image.url,
          fallback: image.file.name,
        });
      }
    }

    for (const id of this.state.fileOrder) {
      const upload = this.state.fileUploads[id];
      if (!upload || upload.state === FileState.UPLOAD_FAILED) {
        continue;
      }
      if (upload.state === FileState.UPLOADING) {
        // TODO: show error to user that they should wait until image is uploaded
        return (this.sending = false);
      }
      if (upload.state === FileState.UPLOADED) {
        attachments.push({
          type: 'file',
          asset_url: upload.url,
          title: upload.file.name,
          mime_type: upload.file.type,
          file_size: upload.file.size,
        });
      }
    }

    // Disallow sending message if its empty.
    if (!text && attachments.length === 0) {
      return (this.sending = false);
    }

    if (this.props.editing) {
      const updatedMessage = { ...this.props.editing };

      updatedMessage.text = text;
      updatedMessage.attachments = attachments;
      updatedMessage.mentioned_users = this.state.mentioned_users.map(
        (mu) => mu.id,
      );
      // TODO: Remove this line and show an error when submit fails
      this.props.clearEditingState();

      const updateMessagePromise = this.props
        .editMessage(updatedMessage)
        .then(this.props.clearEditingState);
      logChatPromiseExecution(updateMessagePromise, 'update message');

      this.sending = false;
    } else {
      try {
        this.props.sendMessage({
          text,
          parent: this.props.parent,
          mentioned_users: uniq(this.state.mentioned_users),
          attachments,
        });

        this.sending = false;
        this.setState((prevState) => ({
          text: '',
          imageUploads: Immutable({}),
          imageOrder: Immutable([]),
          fileUploads: Immutable({}),
          fileOrder: Immutable([]),
          mentioned_users: [],
          numberOfUploads: prevState.numberOfUploads - attachments.length,
        }));
      } catch (err) {
        this.sending = false;
        this.setState({ text });
        console.log('Failed');
      }
    }
  };

  updateMessage = async () => {
    try {
      await this.props.client.editMessage({
        ...this.props.editing,
        text: this.state.text,
      });

      this.setState({ text: '' });
      this.props.clearEditingState();
    } catch (err) {
      console.log(err);
    }
  };

  _pickFile = async () => {
    if (
      this.props.maxNumberOfFiles &&
      this.state.numberOfUploads >= this.props.maxNumberOfFiles
    )
      return;

    const result = await pickDocument();
    if (result.type === 'cancel' || result.cancelled) {
      return;
    }
    const mimeType = lookup(result.name);

    if (mimeType && mimeType.startsWith('image/')) {
      this.uploadNewImage(result);
    } else {
      this.uploadNewFile(result);
    }
  };

  uploadNewFile = (file) => {
    const id = generateRandomId();
    const mimeType = lookup(file.name);
    /* eslint-disable */
    this.setState((prevState) => {
      return {
        numberOfUploads: prevState.numberOfUploads + 1,
        fileOrder: prevState.fileOrder.concat([id]),
        fileUploads: prevState.fileUploads.setIn([id], {
          id,
          file: { ...file, type: mimeType },
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
        response = await this.props.channel.sendFile(
          file.uri,
          file.name,
          file.type,
        );
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
    if (
      this.props.maxNumberOfFiles &&
      this.state.numberOfUploads >= this.props.maxNumberOfFiles
    )
      return;
    const result = await pickImage();

    if (result.cancelled) {
      return;
    }

    this.uploadNewImage(result);
  };

  uploadNewImage = async (image) => {
    const id = generateRandomId();
    /* eslint-disable */
    await this.setState((prevState) => {
      return {
        numberOfUploads: prevState.numberOfUploads + 1,
        imageOrder: prevState.imageOrder.concat([id]),
        imageUploads: prevState.imageUploads.setIn([id], {
          id,
          file: image,
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
    const { file } = this.state.imageUploads[id];
    if (!file) {
      return;
    }

    let response;

    const filename = (file.name || file.uri).replace(
      /^(file:\/\/|content:\/\/)/,
      '',
    );
    const contentType = lookup(filename) || 'application/octet-stream';

    try {
      if (this.props.doImageUploadRequest) {
        response = await this.props.doImageUploadRequest(
          file,
          this.props.channel,
        );
      } else if (this.props.sendImageAsync) {
        this.props.channel
          .sendImage(file.uri, null, contentType)
          .then((res) => {
            if (this.state.asyncIds.includes(id)) {
              // Evaluates to true if user hit send before image successfully uploaded
              this.setState((prevState) => ({
                asyncUploads: prevState.asyncUploads
                  .setIn([id, 'state'], FileState.UPLOADED)
                  .setIn([id, 'url'], res.file),
              }));
            } else {
              this.setState((prevState) => ({
                imageUploads: prevState.imageUploads
                  .setIn([id, 'state'], FileState.UPLOADED)
                  .setIn([id, 'url'], res.file),
              }));
            }
          });
      } else {
        response = await this.props.channel.sendImage(
          file.uri,
          null,
          contentType,
        );
      }

      if (response) {
        this.setState((prevState) => ({
          imageUploads: prevState.imageUploads
            .setIn([id, 'state'], FileState.UPLOADED)
            .setIn([id, 'url'], response.file),
        }));
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
  };

  onChangeText = (text) => {
    if (this.sending) return;
    this.setState({ text });

    if (text) {
      logChatPromiseExecution(
        this.props.channel.keystroke(),
        'start typing event',
      );
    }

    this.props.onChangeText && this.props.onChangeText(text);
  };

  appendText = (text) => {
    this.setState({
      text: this.state.text + text,
    });
  };
  setInputBoxRef = (o) => (this.inputBox = o);

  closeAttachActionSheet = () => {
    this.attachActionSheet.hide();
  };

  renderInputContainer = () => {
    const {
      hasImagePicker,
      hasFilePicker,
      SendButton,
      AttachButton,
      disabled,
      Input,
      t,
    } = this.props;

    let additionalTextInputProps = this.props.additionalTextInputProps || {};

    if (disabled) {
      additionalTextInputProps = {
        editable: false,
        ...additionalTextInputProps,
      };
    }

    return (
      <Container padding={this.state.imageUploads.length > 0}>
        {this.state.fileUploads && (
          <FileUploadPreview
            removeFile={this._removeFile}
            retryUpload={this._uploadFile}
            fileUploads={this.state.fileOrder.map(
              (id) => this.state.fileUploads[id],
            )}
            AttachmentFileIcon={this.props.AttachmentFileIcon}
          />
        )}
        {this.state.imageUploads && (
          <ImageUploadPreview
            removeImage={this._removeImage}
            retryUpload={this._uploadImage}
            imageUploads={this.state.imageOrder.map(
              (id) => this.state.imageUploads[id],
            )}
          />
        )}
        {/**
            TODO: Use custom action sheet to show icon with titles of button. But it doesn't
            work well with async onPress operations. So find a solution.
          */}

        <ActionSheet
          ref={(o) => (this.attachActionSheet = o)}
          title={
            <ActionSheetTitleContainer>
              <ActionSheetTitleText>{t('Add a file')}</ActionSheetTitleText>
              <IconSquare
                icon={iconClose}
                onPress={this.closeAttachActionSheet}
              />
            </ActionSheetTitleContainer>
          }
          options={[
            /* eslint-disable */
            <AttachmentActionSheetItem
              icon={iconGallery}
              text={t('Upload a photo')}
            />,
            <AttachmentActionSheetItem
              icon={iconFolder}
              text={t('Upload a file')}
            />,
            /* eslint-enable */
          ]}
          onPress={(index) => {
            // https://github.com/beefe/react-native-actionsheet/issues/36
            setTimeout(() => {
              switch (index) {
                case 0:
                  this._pickImage();
                  break;
                case 1:
                  this._pickFile();
                  break;
                default:
              }
            }, 201); // 201ms to fire after the animation is complete https://github.com/beefe/react-native-actionsheet/blob/master/lib/ActionSheetCustom.js#L78
          }}
          styles={this.props.actionSheetStyles}
        />
        <InputBoxContainer ref={this.props.setInputBoxContainerRef}>
          {Input ? (
            <Input
              {...this.props}
              getUsers={this.getUsers}
              onSelectItem={this.onSelectItem}
              isValidMessage={this.isValidMessage}
              sendMessage={this.sendMessage}
              updateMessage={this.updateMessage}
              _pickFile={this._pickFile}
              uploadNewFile={this.uploadNewFile}
              _uploadFile={this._uploadFile}
              _pickImage={this._pickImage}
              uploadNewImage={this.uploadNewImage}
              _removeImage={this._removeImage}
              _removeFile={this._removeFile}
              _uploadImage={this._uploadImage}
              onChange={this.onChangeText}
              closeAttachActionSheet={this.closeAttachActionSheet}
              appendText={this.appendText}
              setInputBoxRef={this.setInputBoxRef}
              handleOnPress={async () => {
                if (hasImagePicker && hasFilePicker) {
                  await this.props.dismissKeyboard();
                  this.attachActionSheet.show();
                } else if (hasImagePicker && !hasFilePicker) this._pickImage();
                else if (!hasImagePicker && hasFilePicker) this._pickFile();
              }}
              triggerSettings={ACITriggerSettings({
                channel: this.props.channel,
                onMentionSelectItem: this.onSelectItem,
                t,
              })}
              disabled={disabled}
              value={this.state.text}
              additionalTextInputProps={additionalTextInputProps}
            />
          ) : (
            <>
              {(hasImagePicker || hasFilePicker) && (
                <AttachButton
                  disabled={disabled}
                  handleOnPress={async () => {
                    if (hasImagePicker && hasFilePicker) {
                      await this.props.dismissKeyboard();
                      this.attachActionSheet.show();
                    } else if (hasImagePicker && !hasFilePicker)
                      this._pickImage();
                    else if (!hasImagePicker && hasFilePicker) this._pickFile();
                  }}
                />
              )}
              <AutoCompleteInput
                openSuggestions={this.props.openSuggestions}
                closeSuggestions={this.props.closeSuggestions}
                updateSuggestions={this.props.updateSuggestions}
                value={this.state.text}
                onChange={this.onChangeText}
                getCommands={this.getCommands}
                setInputBoxRef={this.setInputBoxRef}
                triggerSettings={ACITriggerSettings({
                  channel: this.props.channel,
                  onMentionSelectItem: this.onSelectItem,
                  t,
                })}
                additionalTextInputProps={additionalTextInputProps}
              />
              <SendButton
                title={t('Send message')}
                sendMessage={this.sendMessage}
                editing={this.props.editing}
                disabled={disabled || this.sending || !this.isValidMessage()}
              />
            </>
          )}
        </InputBoxContainer>
      </Container>
    );
  };

  render() {
    const { t } = this.props;

    if (this.props.editing) {
      return (
        <React.Fragment>
          <EditingBoxContainer>
            <EditingBoxHeader>
              <EditingBoxHeaderTitle>
                {t('Editing Message')}
              </EditingBoxHeaderTitle>
              <IconSquare
                onPress={() => {
                  this.props.clearEditingState();
                }}
                icon={iconClose}
              />
            </EditingBoxHeader>
            {this.renderInputContainer()}
          </EditingBoxContainer>
        </React.Fragment>
      );
    }

    return this.renderInputContainer();
  }
}

export default withTranslationContext(
  withKeyboardContext(
    withSuggestionsContext(withChannelContext(themed(MessageInput))),
  ),
);

const AttachmentActionSheetItem = ({ icon, text }) => (
  <ActionSheetButtonContainer>
    <IconSquare icon={icon} />
    <ActionSheetButtonText>{text}</ActionSheetButtonText>
  </ActionSheetButtonContainer>
);
