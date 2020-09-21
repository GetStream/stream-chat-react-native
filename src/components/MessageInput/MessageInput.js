import React, { useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components/native';
import uniq from 'lodash/uniq';
import { lookup } from 'mime-types';
import PropTypes from 'prop-types';
import Immutable from 'seamless-immutable';
import { logChatPromiseExecution } from 'stream-chat';

import ActionSheetAttachmentDefault from './ActionSheetAttachment';
import AttachButtonDefault from './AttachButton';
import FileUploadPreviewDefault from './FileUploadPreview';
import ImageUploadPreviewDefault from './ImageUploadPreview';
import SendButtonDefault from './SendButton';

import { useMessageDetailsForState } from './hooks/useMessageDetailsForState';
import { generateRandomId } from './utils/generateRandomId';

import AutoCompleteInput from '../AutoCompleteInput/AutoCompleteInput';
import { IconSquare } from '../IconSquare';

import {
  ChannelContext,
  ChatContext,
  KeyboardContext,
  MessagesContext,
  ThreadContext,
  TranslationContext,
} from '../../context';
import { SuggestionsContext } from '../../contexts/suggestionsContext/SuggestionsContext';
import iconClose from '../../images/icons/icon_close.png';
import { pickDocument, pickImage as pickImageNative } from '../../native';
import { themed } from '../../styles/theme';
import { ACITriggerSettings, FileState } from '../../utils/utils';

const Container = styled.View`
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
  margin-horizontal: 10px;
  padding-top: ${({ imageUploads, theme }) =>
    imageUploads && imageUploads.length
      ? theme.messageInput.container.conditionalPadding
      : 0}px;
  ${({ theme }) => theme.messageInput.container.css};
`;

const EditingBoxContainer = styled.View`
  background-color: white;
  padding-horizontal: 0px;
  shadow-color: grey;
  shadow-opacity: 0.5;
  z-index: 100;
  ${({ theme }) => theme.messageInput.editingBoxContainer.css};
`;

const EditingBoxHeader = styled.View`
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
  padding: 10px;
  ${({ theme }) => theme.messageInput.editingBoxHeader.css};
`;

const EditingBoxHeaderTitle = styled.Text`
  font-weight: bold;
  ${({ theme }) => theme.messageInput.editingBoxHeaderTitle.css};
`;

const InputBoxContainer = styled.View`
  align-items: center;
  flex-direction: row;
  padding-horizontal: 10px;
  margin: 10px;
  min-height: 46px;
  ${({ theme }) => theme.messageInput.inputBoxContainer.css};
`;

/**
 * UI Component for message input
 * It's a consumer of
 * [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext),
 * [Chat Context](https://getstream.github.io/stream-chat-react-native/#chatcontext),
 * [Keyboard Context](https://getstream.github.io/stream-chat-react-native/#keyboardcontext),
 * [Messages Context](https://getstream.github.io/stream-chat-react-native/#messagescontext),
 * [Suggestions Context](https://getstream.github.io/stream-chat-react-native/#suggestionscontext),
 * [Thread Context](https://getstream.github.io/stream-chat-react-native/#threadcontext), and
 * [Translation Context](https://getstream.github.io/stream-chat-react-native/#translationcontext)
 *
 * @example ../docs/MessageInput.md
 */
const MessageInput = (props) => {
  const channelContext = useContext(ChannelContext);
  const { channel, disabled = false, members, watchers } = channelContext;

  const chatContext = useContext(ChatContext);
  const { client } = chatContext;

  const keyboardContext = useContext(KeyboardContext);
  const { dismissKeyboard } = keyboardContext;

  const messagesContext = useContext(MessagesContext);
  const {
    clearEditingState,
    editing,
    editMessage,
    sendMessage: sendMessageContext,
  } = messagesContext;

  const suggestionsContext = useContext(SuggestionsContext);
  const { setInputBoxContainerRef } = suggestionsContext;

  // TODO: not sure if this is actually needed but adding it in from the previously all encompassing usage of withChannelContext
  const threadContext = useContext(ThreadContext);

  const translationContext = useContext(TranslationContext);
  const { t } = translationContext;

  const {
    ActionSheetAttachment = ActionSheetAttachmentDefault,
    actionSheetStyles,
    additionalTextInputProps,
    AttachButton = AttachButtonDefault,
    AttachmentFileIcon,
    compressImageQuality,
    doDocUploadRequest,
    doImageUploadRequest,
    FileUploadPreview = FileUploadPreviewDefault,
    hasFilePicker = true,
    hasImagePicker = true,
    ImageUploadPreview = ImageUploadPreviewDefault,
    initialValue,
    Input,
    maxNumberOfFiles,
    onChangeText: onChangeTextProp,
    parent,
    SendButton = SendButtonDefault,
    sendImageAsync = false,
  } = props;

  /**
   * TODO: This should be removed when possible along with the spread into Input
   */
  const legacyProps = {
    ...props,
    ...channelContext,
    ...chatContext,
    ...keyboardContext,
    ...messagesContext,
    ...suggestionsContext,
    ...threadContext,
    ...translationContext,
  };

  const attachActionSheet = useRef();
  const inputBox = useRef();
  const sending = useRef(false);

  const [asyncIds, setAsyncIds] = useState(Immutable([]));
  const [asyncUploads, setAsyncUploads] = useState(Immutable([]));
  const {
    fileUploads,
    imageUploads,
    mentionedUsers,
    numberOfUploads,
    setFileUploads,
    setImageUploads,
    setMentionedUsers,
    setNumberOfUploads,
    setText,
    text,
  } = useMessageDetailsForState(editing, initialValue);

  useEffect(() => {
    if (editing) {
      if (inputBox.current) {
        inputBox.current.focus();
      }
    }
  }, [editing]);

  useEffect(() => {
    if (Object.keys(asyncUploads).length) {
      /**
       * When successful image upload response occurs after hitting send,
       * send a follow up message with the image
       */
      sending.current = true;
      asyncIds.forEach((id) => sendMessageAsync(id));
      sending.current = false;
    }
  }, [asyncIds, asyncUploads, sending, sendMessageAsync]);

  const appendText = (newText) => {
    setText((prevText) => `${prevText}${newText}`);
  };

  const closeAttachActionSheet = () => {
    attachActionSheet.current.hide();
  };

  const getMembers = () => {
    const result = [];
    if (members && Object.values(members).length) {
      Object.values(members).forEach((member) => result.push(member.user));
    }

    return result;
  };

  const getUsers = () => {
    const users = [...getMembers(), ...getWatchers()];

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

  const getWatchers = () => {
    const result = [];
    if (watchers && Object.values(watchers).length) {
      result.push(...Object.values(watchers));
    }

    return result;
  };

  /** Checks if the message is valid or not. Accordingly we can enable/disable send button */
  const isValidMessage = () => {
    if (text) {
      return true;
    }

    for (const image of imageUploads) {
      if (!image || image.state === FileState.UPLOAD_FAILED) {
        continue;
      }
      if (image.state === FileState.UPLOADING) {
        // TODO: show error to user that they should wait until image is uploaded
        return false;
      }

      return true;
    }

    for (const file of fileUploads) {
      if (!file || file.state === FileState.UPLOAD_FAILED) {
        continue;
      }
      if (file.state === FileState.UPLOADING) {
        // TODO: show error to user that they should wait until image is uploaded
        return false;
      }

      return true;
    }

    return false;
  };

  const onChangeText = (newText) => {
    if (sending.current) {
      return;
    }
    setText(newText);

    if (newText) {
      logChatPromiseExecution(channel.keystroke(), 'start typing event');
    }

    if (onChangeTextProp) {
      onChangeTextProp(newText);
    }
  };

  const onSelectItem = (item) => {
    setMentionedUsers((prevMentionedUsers) => [...prevMentionedUsers, item.id]);
  };

  const pickFile = async () => {
    if (maxNumberOfFiles && numberOfUploads >= maxNumberOfFiles) {
      return;
    }

    const result = await pickDocument({ maxNumberOfFiles });
    if (!result.cancelled) {
      if (result.docs) {
        // condition to support react-native-image-crop-picker
        result.docs.forEach((doc) => {
          const mimeType = lookup(doc.name);

          if (mimeType && mimeType.startsWith('image/')) {
            uploadNewImage(doc);
          } else {
            uploadNewFile(doc);
          }
        });
      } else {
        // condition to support react-native-image-crop-picker
        const mimeType = lookup(result.name);

        if (mimeType && mimeType.startsWith('image/')) {
          uploadNewImage(result);
        } else {
          uploadNewFile(result);
        }
      }
    }
  };

  const pickImage = async () => {
    if (maxNumberOfFiles && numberOfUploads >= maxNumberOfFiles) {
      return;
    }
    const result = await pickImageNative({
      compressImageQuality,
      maxNumberOfFiles,
    });

    if (!result.cancelled) {
      if (result.images) {
        result.images.forEach((image) => {
          uploadNewImage(image);
        });
      } else {
        uploadNewImage(result);
      }
    }
  };

  const removeFile = (id) => {
    const fileExists = fileUploads.some((file) => file.id === id);
    if (fileExists) {
      setFileUploads((prevFileUploads) =>
        prevFileUploads.filter((file) => file.id !== id),
      );
      setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads - 1);
    }
  };

  const removeImage = (id) => {
    const imageExists = imageUploads.some((image) => image.id === id);
    if (imageExists) {
      setImageUploads((prevImageUploads) =>
        prevImageUploads.filter((image) => image.id !== id),
      );
      setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads - 1);
    }
  };

  const renderInputContainer = () => {
    let additionalTextInputContainerProps = additionalTextInputProps || {};

    if (disabled) {
      additionalTextInputContainerProps = {
        editable: false,
        ...additionalTextInputContainerProps,
      };
    }

    return (
      <Container imageUploads={imageUploads}>
        {fileUploads && (
          <FileUploadPreview
            AttachmentFileIcon={AttachmentFileIcon}
            fileUploads={fileUploads}
            removeFile={removeFile}
            retryUpload={uploadFile}
          />
        )}
        {imageUploads && (
          <ImageUploadPreview
            imageUploads={imageUploads}
            removeImage={removeImage}
            retryUpload={uploadImage}
          />
        )}
        {/**
            TODO: Use custom action sheet to show icon with titles of button. But it doesn't
            work well with async onPress operations. So find a solution.
          */}

        <ActionSheetAttachment
          closeAttachActionSheet={closeAttachActionSheet}
          pickFile={pickFile}
          pickImage={pickImage}
          setAttachActionSheetRef={setAttachActionSheetRef}
          styles={actionSheetStyles}
        />
        <InputBoxContainer ref={setInputBoxContainerRef}>
          {Input ? (
            <Input
              {...legacyProps}
              _pickFile={pickFile}
              _pickImage={pickImage}
              _removeFile={removeFile}
              _removeImage={removeImage}
              _uploadFile={uploadFile}
              _uploadImage={uploadImage}
              additionalTextInputProps={additionalTextInputContainerProps}
              appendText={appendText}
              closeAttachActionSheet={closeAttachActionSheet}
              disabled={disabled}
              getUsers={getUsers}
              handleOnPress={async () => {
                if (hasImagePicker && hasFilePicker) {
                  await dismissKeyboard();
                  attachActionSheet.current.show();
                } else if (hasImagePicker && !hasFilePicker) pickImage();
                else if (!hasImagePicker && hasFilePicker) pickFile();
              }}
              isValidMessage={isValidMessage}
              onChange={onChangeText}
              onSelectItem={onSelectItem}
              sendMessage={sendMessage}
              setInputBoxContainerRef={setInputBoxContainerRef}
              setInputBoxRef={setInputBoxRef}
              triggerSettings={ACITriggerSettings({
                channel,
                onMentionSelectItem: onSelectItem,
                t,
              })}
              updateMessage={updateMessage}
              uploadNewFile={uploadNewFile}
              uploadNewImage={uploadNewImage}
              value={text}
            />
          ) : (
            <>
              {(hasImagePicker || hasFilePicker) && (
                <AttachButton
                  disabled={disabled}
                  handleOnPress={async () => {
                    if (hasImagePicker && hasFilePicker) {
                      await dismissKeyboard();
                      attachActionSheet.current.show();
                    } else if (hasImagePicker && !hasFilePicker) pickImage();
                    else if (!hasImagePicker && hasFilePicker) {
                      pickFile();
                    }
                  }}
                />
              )}
              <AutoCompleteInput
                additionalTextInputProps={additionalTextInputProps}
                onChange={onChangeText}
                setInputBoxRef={setInputBoxRef}
                triggerSettings={ACITriggerSettings({
                  channel,
                  onMentionSelectItem: onSelectItem,
                  t,
                })}
                value={text}
              />
              <SendButton
                disabled={disabled || sending.current || !isValidMessage()}
                editing={editing}
                sendMessage={sendMessage}
              />
            </>
          )}
        </InputBoxContainer>
      </Container>
    );
  };

  const sendMessage = async () => {
    if (sending.current) {
      return;
    }
    sending.current = true;

    const prevText = text;
    await setText('');
    if (inputBox.current) {
      inputBox.current.clear();
    }

    const attachments = [];
    for (const image of imageUploads) {
      if (!image || image.state === FileState.UPLOAD_FAILED) {
        continue;
      }

      if (image.state === FileState.UPLOADING) {
        // TODO: show error to user that they should wait until image is uploaded
        if (sendImageAsync) {
          /**
           * If user hit send before image uploaded, push ID into a queue to later
           * be matched with the successful CDN response
           */
          setAsyncIds((prevAsyncIds) => [...prevAsyncIds, image.id]);
        } else {
          sending.current = false;
          return setText(prevText);
        }
      }

      if (image.state === FileState.UPLOADED) {
        attachments.push({
          fallback: image.file.name,
          image_url: image.url,
          type: 'image',
        });
      }
    }

    for (const file of fileUploads) {
      if (!file || file.state === FileState.UPLOAD_FAILED) {
        continue;
      }
      if (file.state === FileState.UPLOADING) {
        // TODO: show error to user that they should wait until image is uploaded
        return (sending.current = false);
      }
      if (file.state === FileState.UPLOADED) {
        attachments.push({
          asset_url: file.url,
          file_size: file.file.size,
          mime_type: file.file.type,
          title: file.file.name,
          type: 'file',
        });
      }
    }

    // Disallow sending message if its empty.
    if (!prevText && attachments.length === 0) {
      return (sending.current = false);
    }

    if (editing) {
      const updatedMessage = { ...editing };

      updatedMessage.text = prevText;
      updatedMessage.attachments = attachments;
      updatedMessage.mentioned_users = mentionedUsers.map((mu) => mu.id);
      // TODO: Remove this line and show an error when submit fails
      clearEditingState();

      const updateMessagePromise = editMessage(updatedMessage).then(
        clearEditingState,
      );
      logChatPromiseExecution(updateMessagePromise, 'update message');

      sending.current = false;
    } else {
      try {
        sendMessageContext({
          attachments,
          mentioned_users: uniq(mentionedUsers),
          parent,
          text: prevText,
        });

        sending.current = false;
        setFileUploads(Immutable([]));
        setImageUploads(Immutable([]));
        setMentionedUsers([]);
        setNumberOfUploads(
          (prevNumberOfUploads) => prevNumberOfUploads - attachments.length,
        );
        setText('');
      } catch (err) {
        sending.current = false;
        setText(prevText);
        console.log('Failed');
      }
    }
  };

  const sendMessageAsync = (id) => {
    const image = asyncUploads[id];
    if (!image || image.state === FileState.UPLOAD_FAILED) {
      return;
    }

    if (image.state === FileState.UPLOADED) {
      const attachments = [
        {
          image_url: image.url,
          type: 'image',
        },
      ];

      try {
        sendMessageContext({
          attachments,
          mentioned_users: [],
          parent,
          text: '',
        });

        setAsyncIds((prevAsyncIds) =>
          prevAsyncIds.splice(prevAsyncIds.indexOf(id), 1),
        );
        setAsyncUploads((prevAsyncUploads) => prevAsyncUploads.without([id]));

        setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads - 1);
      } catch (err) {
        console.log('Failed');
      }
    }
  };

  const setAttachActionSheetRef = (o) => (attachActionSheet.current = o);

  const setInputBoxRef = (o) => (inputBox.current = o);

  const updateMessage = async () => {
    try {
      await client.editMessage({
        ...editing,
        text,
      });

      setText('');
      clearEditingState();
    } catch (err) {
      console.log(err);
    }
  };

  const uploadFile = async ({ newFile }) => {
    if (!newFile) {
      return;
    }
    const { file, id } = newFile;

    await setFileUploads((prevFileUploads) =>
      prevFileUploads.map((fileUpload) => {
        if (fileUpload.id === id) {
          return {
            ...fileUpload,
            state: FileState.UPLOADING,
          };
        }
        return fileUpload;
      }),
    );

    let response = {};
    response = {};
    try {
      if (doDocUploadRequest) {
        response = await doDocUploadRequest(file, channel);
      } else {
        response = await channel.sendFile(file.uri, file.name, file.type);
      }
    } catch (e) {
      console.warn(e);
      if (!newFile) {
        setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads - 1);
      } else {
        setFileUploads((prevFileUploads) =>
          prevFileUploads.map((fileUpload) => {
            if (fileUpload.id === id) {
              return {
                ...fileUpload,
                state: FileState.UPLOAD_FAILED,
              };
            }
            return fileUpload;
          }),
        );
        setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads - 1);
      }
      return;
    }

    setFileUploads((prevFileUploads) =>
      prevFileUploads.map((fileUpload) => {
        if (fileUpload.id === id) {
          return {
            ...fileUpload,
            state: FileState.UPLOADED,
            url: response.file,
          };
        }
        return fileUpload;
      }),
    );
  };

  const uploadImage = async ({ newImage }) => {
    const { file } = newImage || {};
    if (!file) {
      return;
    }

    const id = newImage.id;

    let response;

    const filename = (file.name || file.uri).replace(
      /^(file:\/\/|content:\/\/)/,
      '',
    );
    const contentType = lookup(filename) || 'application/octet-stream';

    try {
      if (doImageUploadRequest) {
        response = await doImageUploadRequest(file, channel);
      } else if (sendImageAsync) {
        channel.sendImage(file.uri, null, contentType).then((res) => {
          if (asyncIds.includes(id)) {
            // Evaluates to true if user hit send before image successfully uploaded
            setAsyncUploads((prevAsyncUploads) =>
              prevAsyncUploads
                .setIn([id, 'state'], FileState.UPLOADED)
                .setIn([id, 'url'], res.file),
            );
          } else {
            setImageUploads((prevImageUploads) =>
              prevImageUploads.map((imageUpload) => {
                if (imageUpload.id === id) {
                  return {
                    ...imageUpload,
                    state: FileState.UPLOADED,
                    url: res.file,
                  };
                }
                return imageUpload;
              }),
            );
          }
        });
      } else {
        response = await channel.sendImage(file.uri, null, contentType);
      }

      if (response) {
        setImageUploads((prevImageUploads) =>
          prevImageUploads.map((imageUpload) => {
            if (imageUpload.id === id) {
              return {
                ...imageUpload,
                state: FileState.UPLOADED,
                url: response.file,
              };
            }
            return imageUpload;
          }),
        );
      }
    } catch (e) {
      console.warn(e);
      if (newImage) {
        setImageUploads((prevImageUploads) =>
          prevImageUploads.map((imageUpload) => {
            if (imageUpload.id === id) {
              return {
                ...imageUpload,
                state: FileState.UPLOAD_FAILED,
              };
            }
            return imageUpload;
          }),
        );
      }
      setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads - 1);

      return;
    }
  };

  const uploadNewFile = async (file) => {
    const id = generateRandomId();
    const mimeType = lookup(file.name);
    const newFile = {
      file: { ...file, type: mimeType },
      id,
      state: FileState.UPLOADING,
    };
    await Promise.all([
      setFileUploads((prevFileUploads) => prevFileUploads.concat([newFile])),
      setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads + 1),
    ]);

    uploadFile({ newFile });
  };

  const uploadNewImage = async (image) => {
    const id = generateRandomId();
    const newImage = {
      file: image,
      id,
      state: FileState.UPLOADING,
    };
    await Promise.all([
      setImageUploads((prevImageUploads) =>
        prevImageUploads.concat([newImage]),
      ),
      setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads + 1),
    ]);

    uploadImage({ newImage });
  };

  return editing ? (
    <EditingBoxContainer testID='editing'>
      <EditingBoxHeader>
        <EditingBoxHeaderTitle>{t('Editing Message')}</EditingBoxHeaderTitle>
        <IconSquare
          icon={iconClose}
          onPress={() => {
            clearEditingState();
            setText('');
          }}
        />
      </EditingBoxHeader>
      {renderInputContainer()}
    </EditingBoxContainer>
  ) : (
    renderInputContainer()
  );
};

MessageInput.propTypes = {
  /**
   * Custom UI component for ActionSheetAttachment.
   *
   * Defaults to and accepts same props as: [ActionSheetAttachment](https://getstream.github.io/stream-chat-react-native/#actionsheetattachment)
   */
  ActionSheetAttachment: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Style object for actionsheet (used for option to choose file attachment or photo attachment).
   * Supported styles: https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js
   */
  actionSheetStyles: PropTypes.object,
  /**
   * Additional props for underlying TextInput component. These props will be forwarded as it is to TextInput component.
   *
   * @see See https://reactnative.dev/docs/textinput#reference
   */
  additionalTextInputProps: PropTypes.object,
  /**
   * Custom UI component for attach button.
   *
   * Defaults to and accepts same props as: [AttachButton](https://getstream.github.io/stream-chat-react-native/#attachbutton)
   */
  AttachButton: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Custom UI component for attachment icon for type 'file' attachment in preview.
   * Defaults to and accepts same props as: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileIcon.js
   */
  AttachmentFileIcon: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /** Compress image with quality (from 0 to 1, where 1 is best quality). On iOS, values larger than 0.8 don't produce a noticeable quality increase in most images, while a value of 0.8 will reduce the file size by about half or less compared to a value of 1. Image picker defaults to 0.8 for iOS and 1 for Android */
  compressImageQuality: PropTypes.number,
  /**
   * Override file upload request
   *
   * @param file    File object - { uri: '', name: '' }
   * @param channel Current channel object
   * */
  doDocUploadRequest: PropTypes.func,
  /**
   * Override image upload request
   *
   * @param file    File object - { uri: '' }
   * @param channel Current channel object
   * */
  doImageUploadRequest: PropTypes.func,
  /**
   * Custom UI component for FileUploadPreview.
   * Defaults to and accepts same props as: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageInput/FileUploadPreview.js
   */
  FileUploadPreview: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /** If component should have file picker functionality  */
  hasFilePicker: PropTypes.bool,
  /** If component should have image picker functionality  */
  hasImagePicker: PropTypes.bool,
  /**
   * Custom UI component for ImageUploadPreview.
   * Defaults to and accepts same props as: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageInput/ImageUploadPreview.js
   */
  ImageUploadPreview: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /** Initial value to set on input */
  initialValue: PropTypes.string,
  /** Limit on allowed number of files to attach at a time. */
  maxNumberOfFiles: PropTypes.number,
  /**
   * Callback that is called when the text input's text changes. Changed text is passed as a single string argument to the callback handler.
   *
   * @param newText
   */
  onChangeText: PropTypes.func,
  /** Parent message object - in case of thread */
  parent: PropTypes.object,
  /**
   * Custom UI component for send button.
   *
   * Defaults to and accepts same props as: [SendButton](https://getstream.github.io/stream-chat-react-native/#sendbutton)
   */
  SendButton: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * For images still in uploading state when user hits send, send text immediately and send image as follow-up message once uploaded
   */
  sendImageAsync: PropTypes.bool,
};

MessageInput.themePath = 'messageInput';

export default themed(MessageInput);
