import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';
import {
  withChannelContext,
  withSuggestionsContext,
  withKeyboardContext,
} from '../context';
import { logChatPromiseExecution } from 'stream-chat';
import { ImageUploadPreview } from './ImageUploadPreview';
import { FileUploadPreview } from './FileUploadPreview';
import { IconSquare } from './IconSquare';
import { pickImage, pickDocument } from '../native';
import { lookup } from 'mime-types';
import Immutable from 'seamless-immutable';
import { FileState, ACITriggerSettings } from '../utils';
import PropTypes from 'prop-types';
import uniq from 'lodash/uniq';
import styled from '@stream-io/styled-components';
import { themed } from '../styles/theme';
import { SendButton } from './SendButton';

import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet';
// import iconMedia from '../images/icons/icon_attach-media.png';

import iconAddAttachment from '../images/icons/plus-outline.png';
import iconGallery from '../images/icons/icon_attach-media.png';
import iconFolder from '../images/icons/icon_folder.png';
import iconClose from '../images/icons/icon_close.png';
import { AutoCompleteInput } from './AutoCompleteInput';

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

const AttachButton = styled.TouchableOpacity`
  margin-right: 8;
  ${({ theme }) => theme.messageInput.attachButton.css}
`;

const AttachButtonIcon = styled.Image`
  width: 15;
  height: 15;
  ${({ theme }) => theme.messageInput.attachButtonIcon.css}
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
 * @example ./docs/MessageInput.md
 * @extends PureComponent
 */
const MessageInput = withKeyboardContext(
  withSuggestionsContext(
    withChannelContext(
      themed(
        class MessageInput extends PureComponent {
          constructor(props) {
            super(props);
            const state = this.getMessageDetailsForState(props.editing);
            this.state = { ...state };
          }

          static themePath = 'messageInput';
          static propTypes = {
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
            SendButton: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
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
              PropTypes.func,
            ]),
          };

          static defaultProps = {
            hasImagePicker: true,
            hasFilePicker: true,
            SendButton,
          };

          getMessageDetailsForState = (message) => {
            const imageOrder = [];
            const imageUploads = {};
            const fileOrder = [];
            const fileUploads = {};
            const attachments = [];
            let mentioned_users = [];
            let text = '';

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

          getUsers = () => {
            const users = [];
            const members = this.props.members;
            const watchers = this.props.watchers;
            if (members && Object.values(members).length) {
              Object.values(members).forEach((member) =>
                users.push(member.user),
              );
            }

            if (watchers && Object.values(watchers).length) {
              users.push(...Object.values(watchers));
            }

            // make sure we don't list users twice
            const userMap = {};
            for (const user of users) {
              if (user !== undefined && !userMap[user.id]) {
                userMap[user.id] = user;
              }
            }
            const usersArray = Object.values(userMap);
            return usersArray;
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
              this.setState(this.getMessageDetailsForState(this.props.editing));
            }

            if (
              this.props.editing &&
              prevProps.editing &&
              this.props.editing.id !== prevProps.editing.id
            ) {
              this.setState(this.getMessageDetailsForState(this.props.editing));
            }

            if (!this.props.editing && prevProps.editing) {
              this.setState(this.getMessageDetailsForState());
            }
          }

          onSelectItem = (item) => {
            this.setState((prevState) => ({
              mentioned_users: [...prevState.mentioned_users, item.id],
            }));
          };

          sendMessage = () => {
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

            // Disallow sending message if its empty.
            if (!this.state.text && attachments.length === 0) return;

            if (this.props.editing) {
              const updatedMessage = { ...this.props.editing };

              updatedMessage.text = this.state.text;
              updatedMessage.attachments = attachments;
              updatedMessage.mentioned_users = this.state.mentioned_users.map(
                (mu) => mu.id,
              );
              // TODO: Remove this line and show an error when submit fails
              this.props.clearEditingState();

              const updateMessagePromise = this.props.client
                .updateMessage(updatedMessage)
                .then(() => {
                  this.props.clearEditingState();
                });
              logChatPromiseExecution(updateMessagePromise, 'update message');
            } else {
              try {
                this.props.sendMessage({
                  text: this.state.text,
                  parent: this.props.parent,
                  mentioned_users: uniq(this.state.mentioned_users),
                  attachments,
                });
                this.setState({
                  text: '',
                  imageUploads: Immutable({}),
                  imageOrder: Immutable([]),
                  fileUploads: Immutable({}),
                  fileOrder: Immutable([]),
                  mentioned_users: [],
                });
              } catch (err) {
                console.log('Fialed');
              }
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

          // https://stackoverflow.com/a/29234240/7625485
          constructTypingString = (dict) => {
            const arr2 = Object.keys(dict);
            const arr3 = [];
            arr2.forEach((item, i) => {
              if (this.props.client.user.id === dict[arr2[i]].user.id) {
                return;
              }
              arr3.push(dict[arr2[i]].user.name || dict[arr2[i]].user.id);
            });
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
            if (
              this.props.maxNumberOfFiles &&
              this.state.numberOfUploads >= this.props.maxNumberOfFiles
            )
              return;

            const result = await pickDocument();
            if (result.type === 'cancel') {
              return;
            }
            const mimeType = lookup(result.name);

            if (mimeType.startsWith('image/')) {
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

          uploadNewImage = (image) => {
            const id = generateRandomId();
            /* eslint-disable */
            this.setState((prevState) => {
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

          onChange = (text) => {
            this.setState({ text });

            if (text) {
              logChatPromiseExecution(
                this.props.channel.keystroke(),
                'start typing event',
              );
            }
          };

          setInputBoxRef = (o) => (this.inputBox = o);

          getCommands = () => {
            const config = this.props.channel.getConfig();

            if (!config) return [];

            const allCommands = config.commands;
            return allCommands;
          };

          closeAttachActionSheet = () => {
            this.attachActionSheet.hide();
          };
          render() {
            const { hasImagePicker, hasFilePicker, SendButton } = this.props;
            let editingBoxStyles = {};
            if (this.props.editing) {
              editingBoxStyles = {
                paddingLeft: 0,
                paddingRight: 0,
                shadowColor: 'gray',
                shadowOpacity: 0.5,
                shadowOffset: { width: 1, height: -3 },
                zIndex: 100,
                backgroundColor: 'white',
              };
            }
            return (
              <React.Fragment>
                <View style={editingBoxStyles}>
                  {this.props.editing && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 10,
                      }}
                    >
                      <Text style={{ fontWeight: 'bold' }}>
                        Editing Message
                      </Text>
                      <IconSquare
                        onPress={() => {
                          this.props.clearEditingState();
                        }}
                        icon={iconClose}
                      />
                    </View>
                  )}

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
                    <InputBoxContainer ref={this.props.setInputBoxContainerRef}>
                      <AttachButton
                        onPress={async () => {
                          if (hasImagePicker && hasFilePicker) {
                            await this.props.dismissKeyboard();
                            this.attachActionSheet.show();
                          } else if (hasImagePicker && !hasFilePicker)
                            this._pickImage();
                          else if (!hasImagePicker && hasFilePicker)
                            this._pickFile();
                        }}
                      >
                        <AttachButtonIcon source={iconAddAttachment} />
                      </AttachButton>
                      {/**
                    TODO: Use custom action sheet to show icon with titles of button. But it doesn't
                    work well with async onPress operations. So find a solution.
                  */}

                      <ActionSheet
                        ref={(o) => (this.attachActionSheet = o)}
                        title={
                          <ActionSheetTitleContainer>
                            <ActionSheetTitleText>
                              Add a file
                            </ActionSheetTitleText>
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
                            text="Upload a photo"
                          />,
                          <AttachmentActionSheetItem
                            icon={iconFolder}
                            text="Upload a file"
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
                          }, 1);
                        }}
                        styles={this.props.actionSheetStyles}
                      />
                      <AutoCompleteInput
                        openSuggestions={this.props.openSuggestions}
                        closeSuggestions={this.props.closeSuggestions}
                        updateSuggestions={this.props.updateSuggestions}
                        value={this.state.text}
                        onChange={this.onChange}
                        getUsers={this.getUsers}
                        getCommands={this.getCommands}
                        setInputBoxRef={this.setInputBoxRef}
                        triggerSettings={ACITriggerSettings({
                          users: this.getUsers(),
                          commands: this.getCommands(),
                          onMentionSelectItem: this.onSelectItem,
                        })}
                        additionalTextInputProps={
                          this.props.additionalTextInputProps
                        }
                      />
                      <SendButton
                        title="Pick an image from camera roll"
                        sendMessage={this.sendMessage}
                        editing={this.props.editing}
                      />
                    </InputBoxContainer>
                  </Container>
                </View>
              </React.Fragment>
            );
          }
        },
      ),
    ),
  ),
);

export { MessageInput };

const AttachmentActionSheetItem = ({ icon, text }) => (
  <ActionSheetButtonContainer>
    <IconSquare icon={icon} />
    <ActionSheetButtonText>{text}</ActionSheetButtonText>
  </ActionSheetButtonContainer>
);
