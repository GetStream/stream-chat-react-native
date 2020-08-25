import React, { useContext, useEffect, useRef, useState } from 'react';
import styled from '@stream-io/styled-components';
import uniq from 'lodash/uniq';
import { lookup } from 'mime-types';
import PropTypes from 'prop-types';
import Immutable from 'seamless-immutable';
import { logChatPromiseExecution } from 'stream-chat';

import ActionSheetAttachmentDefault from './ActionSheetAttachment';
import AttachButtonDefault from './AttachButton';
import FileUploadPreview from './FileUploadPreview';
import ImageUploadPreview from './ImageUploadPreview';
import SendButtonDefault from './SendButton';

import { AutoCompleteInput } from '../AutoCompleteInput';
import { IconSquare } from '../IconSquare';

import {
  ChannelContext,
  ChatContext,
  KeyboardContext,
  MessagesContext,
  SuggestionsContext,
  ThreadContext,
  TranslationContext,
} from '../../context';
import iconClose from '../../images/icons/icon_close.png';
import { pickDocument, pickImage as pickImageNative } from '../../native';
import { themed } from '../../styles/theme';
import { ACITriggerSettings, FileState } from '../../utils';

// https://stackoverflow.com/a/6860916/2570866
const generateRandomId = () =>
  S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();

const S4 = () =>
  (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);

const getMessageDetailsForState = (message, initialValue) => {
  const attachments = [];
  const fileOrder = [];
  const fileUploads = {};
  const imageOrder = [];
  const imageUploads = {};
  let mentioned_users = [];
  let text = initialValue || '';

  if (message) {
    text = message.text;
    for (const attach of message.attachments) {
      if (attach.type === 'image') {
        const id = generateRandomId();
        imageOrder.push(id);
        imageUploads[id] = {
          file: { name: attach.fallback },
          id,
          state: 'finished',
          url: attach.image_url,
        };
      } else if (attach.type === 'file') {
        const id = generateRandomId();
        fileOrder.push(id);
        fileUploads[id] = {
          file: {
            name: attach.title,
            size: attach.file_size,
            type: attach.mime_type,
          },
          id,
          state: 'finished',
          url: attach.asset_url,
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
    attachments,
    fileOrder,
    fileUploads: Immutable(fileUploads),
    imageOrder,
    imageUploads: Immutable(imageUploads),
    mentioned_users,
    numberOfUploads: 0,
    text,
  };
};

const Container = styled.View`
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
  flex-direction: column;
  margin-horizontal: 10px;
  padding-top: ${({ padding, theme }) =>
    padding ? theme.messageInput.container.conditionalPadding : 0}px;
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

  // TODO: remove all but setInputBoxContainerRef for SuggestionsContext. For now it's there to not introduce breaking changes for clients
  const suggestionsContext = useContext(SuggestionsContext);
  const {
    closeSuggestions,
    openSuggestions,
    setInputBoxContainerRef,
    updateSuggestions,
  } = suggestionsContext;

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
    doDocUploadRequest,
    doImageUploadRequest,
    hasFilePicker = true,
    hasImagePicker = true,
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
  const [state, setState] = useState(() =>
    getMessageDetailsForState(editing, initialValue),
  );

  useEffect(() => {
    if (editing) {
      if (inputBox.current) {
        inputBox.current.focus();
      }
      setState(editing, initialValue);
    } else {
      setState(getMessageDetailsForState(null, initialValue));
    }
  }, [editing, initialValue]);

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

  const appendText = (text) => {
    setState((prevState) => ({
      ...prevState,
      text: `${prevState.text}${text}`,
    }));
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
    if (state.text) {
      return true;
    }

    for (const id of state.imageOrder) {
      const image = state.imageUploads[id];
      if (!image || image.state === FileState.UPLOAD_FAILED) {
        continue;
      }
      if (image.state === FileState.UPLOADING) {
        // TODO: show error to user that they should wait until image is uploaded
        return false;
      }

      return true;
    }

    for (const id of state.fileOrder) {
      const upload = state.fileUploads[id];
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

  const onChangeText = (text) => {
    if (sending.current) {
      return;
    }
    setState((prevState) => ({ ...prevState, text }));

    if (text) {
      logChatPromiseExecution(channel.keystroke(), 'start typing event');
    }

    if (onChangeTextProp) {
      onChangeTextProp(text);
    }
  };

  const onSelectItem = (item) => {
    setState((prevState) => ({
      ...prevState,
      mentioned_users: [...prevState.mentioned_users, item.id],
    }));
  };

  const pickFile = async () => {
    if (maxNumberOfFiles && state.numberOfUploads >= maxNumberOfFiles) {
      return;
    }

    const result = await pickDocument();
    if (result.type === 'cancel' || result.cancelled) {
      return;
    }
    const mimeType = lookup(result.name);

    if (mimeType && mimeType.startsWith('image/')) {
      uploadNewImage(result);
    } else {
      uploadNewFile(result);
    }
  };

  const pickImage = async () => {
    if (maxNumberOfFiles && state.numberOfUploads >= maxNumberOfFiles) {
      return;
    }
    const result = await pickImageNative();

    if (result.cancelled) {
      return;
    }

    uploadNewImage(result);
  };

  const removeFile = (id) => {
    setState((prevState) => {
      const file = prevState.fileUploads[id];
      if (!file) {
        return prevState;
      }
      return {
        ...prevState,
        fileOrder: prevState.fileOrder.filter((_id) => id !== _id),
        fileUploads: prevState.fileUploads.set(id, undefined), // remove
        numberOfUploads: prevState.numberOfUploads - 1,
      };
    });
  };

  const removeImage = (id) => {
    setState((prevState) => {
      const img = prevState.imageUploads[id];
      if (!img) {
        return prevState;
      }
      return {
        ...prevState,
        imageOrder: prevState.imageOrder.filter((_id) => id !== _id),
        imageUploads: prevState.imageUploads.set(id, undefined), // remove
        numberOfUploads: prevState.numberOfUploads - 1,
      };
    });
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
      <Container padding={state.imageUploads && state.imageUploads.length > 0}>
        {state.fileUploads && (
          <FileUploadPreview
            AttachmentFileIcon={AttachmentFileIcon}
            fileUploads={state.fileOrder.map((id) => state.fileUploads[id])}
            removeFile={removeFile}
            retryUpload={uploadFile}
          />
        )}
        {state.imageUploads && (
          <ImageUploadPreview
            imageUploads={state.imageOrder.map((id) => state.imageUploads[id])}
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
              closeSuggestions={closeSuggestions}
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
              openSuggestions={openSuggestions}
              sendMessage={sendMessage}
              setInputBoxContainerRef={setInputBoxContainerRef}
              setInputBoxRef={setInputBoxRef}
              triggerSettings={ACITriggerSettings({
                channel,
                onMentionSelectItem: onSelectItem,
                t,
              })}
              updateMessage={updateMessage}
              updateSuggestions={updateSuggestions}
              uploadNewFile={uploadNewFile}
              uploadNewImage={uploadNewImage}
              value={state.text}
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
                value={state.text}
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

    const { text } = state;
    await setState((prevState) => ({ ...prevState, text: '' }));
    inputBox.current.clear();

    const attachments = [];
    for (const id of state.imageOrder) {
      const image = state.imageUploads[id];

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
          setAsyncIds((prevAsyncIds) => [...prevAsyncIds, id]);
        } else {
          sending.current = false;
          return setState((prevState) => ({ ...prevState, text }));
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

    for (const id of state.fileOrder) {
      const upload = state.fileUploads[id];
      if (!upload || upload.state === FileState.UPLOAD_FAILED) {
        continue;
      }
      if (upload.state === FileState.UPLOADING) {
        // TODO: show error to user that they should wait until image is uploaded
        return (sending.current = false);
      }
      if (upload.state === FileState.UPLOADED) {
        attachments.push({
          asset_url: upload.url,
          file_size: upload.file.size,
          mime_type: upload.file.type,
          title: upload.file.name,
          type: 'file',
        });
      }
    }

    // Disallow sending message if its empty.
    if (!text && attachments.length === 0) {
      return (sending.current = false);
    }

    if (editing) {
      const updatedMessage = { ...editing };

      updatedMessage.text = text;
      updatedMessage.attachments = attachments;
      updatedMessage.mentioned_users = state.mentioned_users.map((mu) => mu.id);
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
          mentioned_users: uniq(state.mentioned_users),
          parent,
          text,
        });

        sending.current = false;
        setState((prevState) => ({
          ...prevState,
          fileOrder: Immutable([]),
          fileUploads: Immutable({}),
          imageOrder: Immutable([]),
          imageUploads: Immutable({}),
          mentioned_users: [],
          numberOfUploads: prevState.numberOfUploads - attachments.length,
          text: '',
        }));
      } catch (err) {
        sending.current = false;
        setState((prevState) => ({ ...prevState, text }));
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

        setState((prevState) => ({
          ...prevState,
          numberOfUploads: prevState.numberOfUploads - 1,
        }));
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
        text: state.text,
      });

      setState((prevState) => ({ ...prevState, text: '' }));
      clearEditingState();
    } catch (err) {
      console.log(err);
    }
  };

  const uploadFile = async (id) => {
    const doc = state.fileUploads[id];
    if (!doc) {
      return;
    }
    const { file } = doc;

    await setState((prevState) => ({
      ...prevState,
      fileUploads: prevState.fileUploads.setIn(
        [id, 'state'],
        FileState.UPLOADING,
      ),
    }));

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
      await setState((prevState) => {
        const image = prevState.fileUploads[id];
        if (!image) {
          return {
            ...prevState,
            numberOfUploads: prevState.numberOfUploads - 1,
          };
        }
        return {
          ...prevState,
          fileUploads: prevState.fileUploads.setIn(
            [id, 'state'],
            FileState.UPLOAD_FAILED,
          ),
          numberOfUploads: prevState.numberOfUploads - 1,
        };
      });

      return;
    }

    setState((prevState) => ({
      ...prevState,
      fileUploads: prevState.fileUploads
        .setIn([id, 'state'], FileState.UPLOADED)
        .setIn([id, 'url'], response.file),
    }));
  };

  const uploadImage = async (id) => {
    const { file } = state.imageUploads[id];
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
            setState((prevState) => ({
              ...prevState,
              imageUploads: prevState.imageUploads
                .setIn([id, 'state'], FileState.UPLOADED)
                .setIn([id, 'url'], res.file),
            }));
          }
        });
      } else {
        response = await channel.sendImage(file.uri, null, contentType);
      }

      if (response) {
        setState((prevState) => ({
          ...prevState,
          imageUploads: prevState.imageUploads
            .setIn([id, 'state'], FileState.UPLOADED)
            .setIn([id, 'url'], response.file),
        }));
      }
    } catch (e) {
      console.warn(e);
      await setState((prevState) => {
        const image = prevState.imageUploads[id];
        if (!image) {
          return {
            ...prevState,
            numberOfUploads: prevState.numberOfUploads - 1,
          };
        }

        return {
          ...prevState,
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

  const uploadNewFile = (file) => {
    const id = generateRandomId();
    const mimeType = lookup(file.name);
    /* eslint-disable */
    setState((prevState) => ({
      ...prevState,
      fileOrder: prevState.fileOrder.concat([id]),
      fileUploads: prevState.fileUploads.setIn([id], {
        file: { ...file, type: mimeType },
        id,
        state: FileState.UPLOADING,
      }),
      numberOfUploads: prevState.numberOfUploads + 1,
    }));
    /* eslint-enable */

    uploadFile(id);
  };

  const uploadNewImage = async (image) => {
    const id = generateRandomId();
    /* eslint-disable */
    await setState((prevState) => ({
      ...prevState,
      imageOrder: prevState.imageOrder.concat([id]),
      imageUploads: prevState.imageUploads.setIn([id], {
        file: image,
        id,
        state: FileState.UPLOADING,
      }),
      numberOfUploads: prevState.numberOfUploads + 1,
    }));
    /* eslint-enable */

    uploadImage(id);
  };

  return editing ? (
    <EditingBoxContainer>
      <EditingBoxHeader>
        <EditingBoxHeaderTitle>{t('Editing Message')}</EditingBoxHeaderTitle>
        <IconSquare
          icon={iconClose}
          onPress={() => {
            clearEditingState();
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
  /** If component should have file picker functionality  */
  hasFilePicker: PropTypes.bool,
  /** If component should have image picker functionality  */
  hasImagePicker: PropTypes.bool,
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
